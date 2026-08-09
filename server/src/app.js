import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { requireAuth, requireHouseholdAccess } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { advanceRouter } from './routes/advanceRoutes.js'
import { aiPublicRouter } from './routes/aiPublicRoutes.js'
import { aiRouter } from './routes/aiRoutes.js'
import { authRouter } from './routes/authRoutes.js'
import { goalRouter } from './routes/goalRoutes.js'
import { householdRouter } from './routes/householdRoutes.js'
import { overviewRouter } from './routes/overviewRoutes.js'
import { practiceRouter } from './routes/practiceRoutes.js'
import { promptRouter } from './routes/promptRoutes.js'
import { reportRouter } from './routes/reportRoutes.js'
import { responsibilityRouter } from './routes/responsibilityRoutes.js'
import { simulationRouter } from './routes/simulationRoutes.js'
import { transactionRouter } from './routes/transactionRoutes.js'
import { sendSuccess } from './utils/http.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_request, response) =>
    sendSuccess(response, {
      status: 'ok',
      service: '18-before-18-api',
    }),
  )

  app.use('/api/auth', authRouter)
  app.use('/api/ai', aiPublicRouter)

  app.use('/api', requireAuth, requireHouseholdAccess)
  app.use('/api/household', householdRouter)
  app.use('/api', overviewRouter)
  app.use('/api/transactions', transactionRouter)
  app.use('/api/responsibilities', responsibilityRouter)
  app.use('/api/goals', goalRouter)
  app.use('/api/simulations', simulationRouter)
  app.use('/api/advances', advanceRouter)
  app.use('/api/practice', practiceRouter)
  app.use('/api/reports', reportRouter)
  app.use('/api/prompts', promptRouter)
  app.use('/api/ai', aiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()
