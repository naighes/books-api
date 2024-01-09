import { Request, Response } from 'express'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { OrderCodec } from './codecs'
import { placeOrder } from './model'
import { AppError, flattenValidationErrors } from '../../model'
import { context, trace } from '@opentelemetry/api'
import { replyToError } from '../../utils'

const placeOrderHttpHandler = async (
  req: Request<Record<string, never>, AppError | void, unknown>,
  res: Response<AppError | void>,
): Promise<void> => {
  /*
  #swagger.summary = 'Order placement.'
  #swagger.description = 'Incoming orders cause the stock quantity to decrease.'
  #swagger.operationId = 'place_order'
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          ref: "#/components/schemas/placeOrder"
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: "Order placed",
    content: {}
  }
*/
  const span = trace.getSpan(context.active())
  await pipe(
    TE.fromEither(OrderCodec.decode(req.body)),
    TE.mapLeft(flattenValidationErrors),
    TE.chain(placeOrder),
    TE.fold(replyToError(res, span), () => T.of(res.status(201).end())),
  )()
}

export { placeOrderHttpHandler }
