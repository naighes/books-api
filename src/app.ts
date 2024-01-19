import express, { NextFunction } from 'express'
import { Request, Response } from 'express'
import * as core from 'express-serve-static-core'
import { createMiddleware } from '@promster/express'
import { createServer as createPrometheusMetricsServer } from '@promster/server'
import { Config } from 'config'
import {
  getBooksHttpHandler,
  getBookHttpHandler,
  addBookHttpHandler,
  bookAvailabilityHttpHandler,
} from './routes/books'
import { placeOrderHttpHandler } from './routes/orders'
import { recordDeliveryHttpHandler } from './routes/deliveries'
import { DeliveryModel } from './routes/deliveries/schema'
import { OrderModel } from './routes/orders/schema'
import { handler } from './routes/notifications'
import { registerWebHookHttpHandler } from './routes/webhooks'

const buildApp = async (cfg: Config): Promise<core.Express> => {
  const app = express()
  app.use(createMiddleware({ app }))
  await createPrometheusMetricsServer({
    port: cfg.metricsPort,
    detectKubernetes: false,
  })
  app.use(express.json())
  app.use((error: unknown, _: Request, res: Response, next: NextFunction) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ errors: ['invalid JSON format'] })
    }
    return next(error)
  })
  app.get('/books', getBooksHttpHandler)
  app.get('/books/:bookId', getBookHttpHandler)
  app.get('/books/:bookId/availability', bookAvailabilityHttpHandler)
  app.post('/books', addBookHttpHandler(cfg))
  app.post('/orders', placeOrderHttpHandler)
  app.post('/deliveries', recordDeliveryHttpHandler)
  app.post('/webhooks', registerWebHookHttpHandler)
  DeliveryModel.watch().on('change', handler)
  OrderModel.watch().on('change', handler)
  return app
}

export default buildApp
