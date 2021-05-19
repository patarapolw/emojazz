import fs from 'fs'
import path from 'path'

import fastify from 'fastify'
import cors from 'fastify-cors'
import fastifyStatic from 'fastify-static'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { makeSearch } from './shared'

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
      const idx = makeSearch()
      idx.import(
        fs.readFileSync(path.join(__dirname, '../assets/idx.txt'), 'utf-8'),
      )

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

        const sResponse = S.shape({
          result: S.list(
            S.shape({
              text: S.string(),
              description: S.string(),
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
            const { q = '', page = 1, limit = 50 } = req.query

            if (!q.trim()) {
              return {
                result: [],
                count: 0,
              }
            }

            const rs = await idx.search(q)

            return {
              result: rs.slice((page - 1) * limit, page * limit),
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
          description: S.string(),
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

            const r1 = idx.where({ text: id })[0]

            if (!r1) {
              throw { statusCode: 404 }
            }

            const r2 = imageObject[id] || []

            return {
              description: r1.description,
              images: r2.map((f) => `/img/${f}`),
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
