import { WebHookCodec } from './codecs'
import * as t from 'io-ts'
import { InferSchemaType, Types } from 'mongoose'
import { WebHookModel, WebHookSchema } from './schema'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {
  AppError,
  alreadyExistsError,
  genericError,
  notFoundError,
} from '../../model'
import { MongoServerError } from 'mongoose/node_modules/mongodb'

type WebHook = t.TypeOf<typeof WebHookCodec>

type TT = InferSchemaType<typeof WebHookSchema>

const findWebHooks = (): TE.TaskEither<
  AppError,
  Array<TT & { _id: Types.ObjectId }>
> =>
  pipe(
    TE.tryCatch(
      () => WebHookModel.find<TT & { _id: Types.ObjectId }>({}).exec(),
      () => genericError(`could not retrieve any webhook`),
    ),
    TE.chain((hooks: Array<TT & { _id: Types.ObjectId }>) =>
      pipe(
        O.fromNullable(hooks),
        E.fromOption(() => notFoundError('could not retrieve any webhook')),
        TE.fromEither,
      ),
    ),
  )

const registerWebHook = (
  hook: WebHook,
): TE.TaskEither<AppError, Types.ObjectId> =>
  pipe(
    new Date(),
    (now) =>
      TE.tryCatch(
        () =>
          new WebHookModel({
            url: hook.url,
            createdAt: now,
            updatedAt: now,
          }).save(),
        (e) =>
          e instanceof MongoServerError && e.code === 11000
            ? alreadyExistsError(
                `a webhook for URL '${hook.url}' already exists`,
              )
            : genericError(`webhook could not be saved`),
      ),
    TE.map((hook: TT & { _id: Types.ObjectId }) => hook._id),
  )

export { WebHook, registerWebHook, findWebHooks }
