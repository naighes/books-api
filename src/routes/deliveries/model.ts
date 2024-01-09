import { DeliveryCodec } from './codecs'
import * as t from 'io-ts'
import { InferSchemaType, Types } from 'mongoose'
import { DeliveryModel, DeliverySchema } from './schema'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { AppError, genericError, notFoundError } from '../../model'

type Delivery = t.TypeOf<typeof DeliveryCodec>

type TT = InferSchemaType<typeof DeliverySchema>

const recordDelivery = (
  delivery: Delivery,
): TE.TaskEither<AppError, Types.ObjectId> =>
  pipe(
    new Date(),
    (now) =>
      TE.tryCatch(
        () =>
          new DeliveryModel({
            supplier: delivery.supplier,
            bookIds: delivery.bookIds,
            createdAt: now,
            updatedAt: now,
          }).save(),
        () => genericError(`delivery could not be saved`),
      ),
    TE.map((delivery: TT & { _id: Types.ObjectId }) => delivery._id),
  )

const deliveriesCount = (bookId: string): TE.TaskEither<AppError, number> =>
  pipe(
    TE.tryCatch(
      () => DeliveryModel.find({ bookIds: bookId }).exec(),
      () =>
        genericError(
          `could not retrieve any delivery for book with id ${bookId}`,
        ),
    ),
    TE.chain((deliveries) =>
      pipe(
        O.fromNullable(deliveries),
        E.fromOption(() =>
          notFoundError(
            `could not retrieve any delivery for book with id ${bookId}`,
          ),
        ),
        TE.fromEither,
        TE.map((x) => x.length),
      ),
    ),
  )

export { Delivery, recordDelivery, deliveriesCount }
