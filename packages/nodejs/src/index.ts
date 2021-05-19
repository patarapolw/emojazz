import path from 'path'

import sqlite from 'better-sqlite3'
import fastify from 'fastify'
import cors from 'fastify-cors'
import fastifyStatic from 'fastify-static'
import S from 'jsonschema-definer'

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
      const sql = sqlite(path.join(__dirname, '../assets/search.db'), {
        readonly: true,
      })

      {
        const sQuery = S.shape({
          q: S.string().optional(),
          page: S.integer().optional(),
          limit: S.integer().optional(),
        })

        const sResponse = S.shape({
          result: S.list(S.string()),
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
            const { q = '', page = 1, limit = 20 } = req.query

            if (!q.trim()) {
              return {
                result: [],
                count: 0,
              }
            }

            const r = sql
              .prepare(
                /* sql */ `
            WITH cte AS (
              SELECT DISTINCT [text] FROM q WHERE q LIKE @q||'%' ORDER BY RANK
            )

            SELECT
              (
                SELECT json_group_array([text])
                FROM (
                  SELECT [text]
                  FROM cte
                  LIMIT ${limit}
                  OFFSET ${(page - 1) * limit}
                )
              ) result,
              (
                SELECT COUNT(1)
                FROM cte
              ) [count]
            `,
              )
              .get({ q })

            if (!r) {
              return {
                result: [],
                count: 0,
              }
            }

            return {
              result: JSON.parse(r.result),
              count: r.count,
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

            const r1 = sql
              .prepare(
                /* sql */ `
              SELECT group_concat([description], '\n\n') [description]
              FROM q WHERE [text] = @id
              `,
              )
              .get({ id })

            if (!r1) {
              throw { statusCode: 404 }
            }

            const r2 = sql
              .prepare(
                /* sql */ `
              SELECT [filename] FROM q_image WHERE [text] = @id
              `,
              )
              .all({ id })

            return {
              description: r1.description,
              images: r2.map(({ filename }) => `/img/${filename}`),
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
