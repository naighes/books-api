import { OrderCodec } from './codecs'
import * as t from 'io-ts'
import { InferSchemaType, Types } from 'mongoose'
import { OrderModel, OrderSchema } from './schema'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { AppError, genericError, notFoundError } from '../../model'

type Order = t.TypeOf<typeof OrderCodec>

type TT = InferSchemaType<typeof OrderSchema>

const placeOrder = (order: Order): TE.TaskEither<AppError, Types.ObjectId> =>
  pipe(
    new Date(),
    (now) =>
      TE.tryCatch(
        () =>
          new OrderModel({
            purchaser: order.purchaser,
            bookIds: order.bookIds,
            createdAt: now,
            updatedAt: now,
          }).save(),
        () => genericError(`order could not be saved`),
      ),
    TE.map((order: TT & { _id: Types.ObjectId }) => order._id),
  )

const ordersCount = (bookId: string): TE.TaskEither<AppError, number> =>
  pipe(
    TE.tryCatch(
      () => OrderModel.find({ bookIds: bookId }).exec(),
      () =>
        genericError(`could not retrieve any order for book with id ${bookId}`),
    ),
    TE.chain((orders) =>
      pipe(
        O.fromNullable(orders),
        E.fromOption(() =>
          notFoundError(
            `could not order any delivery for book with id ${bookId}`,
          ),
        ),
        TE.fromEither,
        TE.map((x) => x.length),
      ),
    ),
  )

export { Order, placeOrder, ordersCount }
