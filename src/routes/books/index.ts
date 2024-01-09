import { Request, Response } from 'express'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { BookCodec } from './codecs'
import { Book, findBook, findBooks, saveBook, bookFromSchema } from './model'
import { AppError, flattenValidationErrors } from '../../model'
import { context, trace } from '@opentelemetry/api'
import { Config } from '../../config'
import { replyToError, getParam } from '../../utils'
import { ordersCount } from '../orders/model'
import { deliveriesCount } from '../deliveries/model'

const getBooksHttpHandler = async (
  _: Request<
    Record<string, never>,
    AppError | { books: Array<Book & { id: string }> }
  >,
  res: Response<AppError | { books: Array<Book & { id: string }> }>,
): Promise<void> => {
  /*
  #swagger.summary = 'List all books.'
  #swagger.description = 'List all books.'
  #swagger.operationId = 'find_books'
  #swagger.responses[200] = {
    description: '',
    content: {
      "application/json": {
        schema:{
          $ref: "#/components/schemas/findBooks"
        }
      }
    }
  }
*/
  const span = trace.getSpan(context.active())
  await pipe(
    findBooks(),
    TE.fold(replyToError(res, span), (x) =>
      T.of(res.status(200).json({ books: x.map((y) => bookFromSchema(y)) })),
    ),
  )()
}

const getBookHttpHandler = async (
  req: Request<{ bookId?: string }, AppError | (Book & { id: string })>,
  res: Response<AppError | (Book & { id: string })>,
): Promise<void> => {
  /*
  #swagger.summary = 'Get a book.'
  #swagger.description = 'Get a book.'
  #swagger.operationId = 'find_book'
  #swagger.responses[200] = {
    description: '',
    content: {
      "application/json": {
        schema:{
          $ref: "#/components/schemas/findBook"
        }
      }
    }
  }
*/
  const span = trace.getSpan(context.active())
  span?.setAttribute('bookId', req.params.bookId ?? '<null>')
  await pipe(
    req.params.bookId,
    getParam,
    TE.fromEither,
    TE.chain(findBook),
    TE.fold(replyToError(res, span), (x) =>
      T.of(
        res
          .status(200)
          .setHeader('Last-Modified', x.updatedAt.toUTCString())
          .json(bookFromSchema(x)),
      ),
    ),
  )()
}

const addBookHttpHandler =
  (cfg?: Config) =>
  async (
    req: Request<Record<string, never>, AppError | void, unknown>,
    res: Response<AppError | void>,
  ): Promise<void> => {
    /*
  #swagger.summary = 'Insert a book.'
  #swagger.description = 'Insert a book.'
  #swagger.operationId = 'save_book'
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          ref: "#/components/schemas/saveBook"
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: "Book added",
    content: {}
  }
*/
    const span = trace.getSpan(context.active())
    await pipe(
      TE.fromEither(BookCodec.decode(req.body)),
      TE.mapLeft(flattenValidationErrors),
      TE.chain(saveBook),
      TE.fold(replyToError(res, span), (x) =>
        T.of(
          res
            .status(201)
            .setHeader(
              'Location',
              `${cfg?.baseUrl ?? ''}/books/${x._id.toString()}`,
            )
            .end(),
        ),
      ),
    )()
  }

const bookAvailabilityHttpHandler = async (
  req: Request<{ bookId?: string }, AppError | { count: number }>,
  res: Response<AppError | { count: number }>,
): Promise<void> => {
  /*
  #swagger.summary = 'Retrieve book availability.'
  #swagger.description = 'Retrieve book availability.'
  #swagger.operationId = 'book_availability'
  #swagger.responses[200] = {
    description: '',
    content: {
      "application/json": {
        schema:{
          $ref: "#/components/schemas/bookAvailability"
        }
      }
    }
  }
*/
  const span = trace.getSpan(context.active())
  span?.setAttribute('bookId', req.params.bookId ?? '<null>')
  await pipe(
    req.params.bookId,
    getParam,
    TE.fromEither,
    TE.chain((bookId: string) =>
      pipe(
        ordersCount(bookId),
        TE.chain((count1) =>
          pipe(
            deliveriesCount(bookId),
            TE.map((count2) => count2 - count1),
          ),
        ),
      ),
    ),
    TE.fold(replyToError(res, span), (x) =>
      T.of(res.status(200).json({ count: x })),
    ),
  )()
}

export {
  getBooksHttpHandler,
  getBookHttpHandler,
  addBookHttpHandler,
  bookAvailabilityHttpHandler,
}
