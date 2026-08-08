import { app } from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'

async function startServer() {
  await connectDatabase()

  const server = app.listen(env.PORT, () => {
    console.log(`18 Before 18 API listening on http://localhost:${env.PORT}`)
  })

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing server.`)
    server.close(() => process.exit(0))
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer().catch((error) => {
  console.error('Failed to start API', error)
  process.exit(1)
})
