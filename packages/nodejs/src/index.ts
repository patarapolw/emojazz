import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import lunr from 'elasticlunr'
import fastify from 'fastify'
import cors from 'fastify-cors'
import fastifyStatic from 'fastify-static'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { sSearch, tSearch } from './shared'

async function main() {
  const app = fastify({
    logger: {
      prettyPrint: true,
    },
  })
  const port = process.env.PORT || 5000

  app.register(cors)

  app.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
  })

  app.register(
    async (f) => {
      f.register(fastifyStatic, {
        root: path.join(__dirname, '../assets/img'),
      })
    },
    {
      prefix: '/img',
    },
  )

  app.register(
    async (f) => {
      const searchObject = S.object()
        .additionalProperties(sSearch)
        .ensure(
          yaml.load(
            fs.readFileSync(
              path.join(__dirname, '../assets/search.yaml'),
              'utf-8',
            ),
          ) as any,
        )

      let idx: lunr.Index<{
        text: string
        u: string[]
        c: string[]
        d: string
        t: string[]
      }>
      if (
        fs.existsSync('assets/idx.json') &&
        fs.existsSync('assets/idx.hash') &&
        crypto
          .createHash('sha256')
          .update(yaml.dump(searchObject, { sortKeys: true }))
          .digest()
          .toString('base64') === fs.readFileSync('assets/idx.hash', 'utf-8')
      ) {
        idx = lunr.Index.load(
          JSON.parse(fs.readFileSync('assets/idx.json', 'utf-8')),
        )
      } else {
        idx = lunr(function () {
          this.setRef('text')
          this.addField('u')
          this.addField('c')
          this.addField('d')
          this.addField('t')

          this.saveDocument(false)

          Object.entries(searchObject).map(([text, r]) => {
            this.addDoc({
              text,
              u: r.unicode,
              c: r.categories,
              d: Object.values(r.description).join('\n'),
              t: r.tag,
            })
          })
        })

        fs.writeFileSync('assets/idx.json', JSON.stringify(idx))
        fs.writeFileSync(
          'assets/idx.hash',
          crypto
            .createHash('sha256')
            .update(yaml.dump(searchObject, { sortKeys: true }))
            .digest()
            .toString('base64'),
        )
      }

      const imageObject = S.object()
        .additionalProperties(S.list(S.string()))
        .ensure(
          yaml.load(
            fs.readFileSync(
              path.join(__dirname, '../assets/image.yaml'),
              'utf-8',
            ),
          ) as any,
        )

      {
        const sQuery = S.shape({
          q: S.string().optional(),
          page: S.integer().optional(),
          limit: S.integer().optional(),
        })

        sSearch.copyWith

        const sResponse = S.shape({
          result: S.list(
            S.shape({
              text: S.string(),
              ...tSearch,
            }),
          ),
          count: S.integer(),
        })

        f.get<{
          Querystring: typeof sQuery.type
        }>(
          '/q',
          {
            schema: {
              querystring: sQuery.valueOf(),
              response: {
                200: sResponse.valueOf(),
              },
            },
          },
          async (req): Promise<typeof sResponse.type> => {
            const { page = 1, limit = 50 } = req.query
            let { q = '' } = req.query
            q = q.trimLeft()

            if (!q) {
              return {
                result: [],
                count: 0,
              }
            }

            const rs = idx.search(/\s+$/.test(q) ? q : q + '*', {
              fields: {
                c: { bool: 'AND', boost: 2 },
                d: { bool: 'AND' },
                t: { bool: 'AND', boost: 5 },
              },
            })

            return {
              result: rs
                .map((r) => ({
                  text: r.ref,
                  ...searchObject[r.ref],
                }))
                .slice((page - 1) * limit, page * limit),
              count: rs.length,
            }
          },
        )
      }

      {
        const sQuery = S.shape({
          id: S.string(),
        })

        const sResponse = S.shape({
          ...tSearch,
          images: S.list(S.string()),
        })

        f.get<{
          Querystring: typeof sQuery.type
        }>(
          '/',
          {
            schema: {
              querystring: sQuery.valueOf(),
              response: {
                200: sResponse.valueOf(),
              },
            },
          },
          async (req): Promise<typeof sResponse.type> => {
            const { id } = req.query

            const r1 = searchObject[id]

            if (!r1) {
              throw { statusCode: 404 }
            }

            const r2 = imageObject[id] || []

            return {
              ...r1,
              images: r2,
            }
          },
        )
      }
    },
    {
      prefix: '/api',
    },
  )

  app.listen(port, (err) => {
    if (err) {
      console.error(err)
    } else {
      console.log(`Server is running at http://localhost:${port}`)
    }
  })
}

if (require.main === module) {
  main()
}
