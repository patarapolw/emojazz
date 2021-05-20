import path from 'path'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

async function main() {
  const app = fastify({
    logger: {
      prettyPrint: true,
    },
  })
  const port = process.env.PORT || 5000

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
      f.register(fastifyStatic, {
        root: path.join(__dirname, '../assets/fonts'),
      })
    },
    {
      prefix: '/fonts',
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
