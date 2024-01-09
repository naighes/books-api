import { Request, Response } from 'express'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { DeliveryCodec } from './codecs'
import { recordDelivery } from './model'
import { AppError, flattenValidationErrors } from '../../model'
import { context, trace } from '@opentelemetry/api'
import { replyToError } from '../../utils'

const recordDeliveryHttpHandler = async (
  req: Request<Record<string, never>, AppError | void, unknown>,
  res: Response<AppError | void>,
): Promise<void> => {
  /*
  #swagger.summary = 'Delivery recording.'
  #swagger.description = 'Deliveries increase the stock.'
  #swagger.operationId = 'record_delivery'
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          ref: "#/components/schemas/recordDelivery"
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: "Delivery recorded",
    content: {}
  }
*/
  const span = trace.getSpan(context.active())
  await pipe(
    TE.fromEither(DeliveryCodec.decode(req.body)),
    TE.mapLeft(flattenValidationErrors),
    TE.chain(recordDelivery),
    TE.fold(replyToError(res, span), () => T.of(res.status(201).end())),
  )()
}

export { recordDeliveryHttpHandler }
