import { addBookHttpHandler, getBooksHttpHandler } from '../src/routes/books'
import { Request, Response } from 'express'
import { Book } from '../src/routes/books/model'
import { AppError } from '../src/model'
import { createSandbox, SinonSandbox, SinonStub, assert as verify } from 'sinon'
import { BookModel, BookSchema } from '../src/routes/books/schema'
import { InferSchemaType, Query, Types } from 'mongoose'
import { mockReq, mockRes } from 'sinon-express-mock'
import * as TE from 'fp-ts/TaskEither'
type TT = InferSchemaType<typeof BookSchema>
import * as model from '../src/routes/books/model'

describe('get books', () => {
  type GetBooksRequest = Request<
    Record<string, never>,
    AppError | { books: Array<Book & { id: string }> }
  >
  type GetBooksResponse = Response<
    AppError | { books: Array<Book & { id: string }> }
  >

  let sandbox: SinonSandbox
  let mocked: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    mocked = sandbox.stub(BookModel, 'find')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('empty result', async () => {
    const req = mockReq() as mockReq.MockReq & GetBooksRequest
    const res = mockRes() as GetBooksResponse & mockRes.MockRes
    const result = {
      exec: () => new Promise<Array<TT> | null | undefined>((r) => r([])),
    } as Query<Array<TT>, TT>
    mocked.returns(result)
    await getBooksHttpHandler(req, res)
    verify.calledWith(res.status, 200)
  })

  it('null result', async () => {
    const req = mockReq() as mockReq.MockReq & GetBooksRequest
    const res = mockRes() as GetBooksResponse & mockRes.MockRes
    const result = {
      exec: () => new Promise<Array<TT> | null | undefined>((r) => r(null)),
    } as Query<Array<TT>, TT>
    mocked.returns(result)
    await getBooksHttpHandler(req, res)
    verify.calledWith(res.status, 404)
  })

  it('db call throwing error', async () => {
    const req = mockReq() as mockReq.MockReq & GetBooksRequest
    const res = mockRes() as GetBooksResponse & mockRes.MockRes
    mocked.throws('oh my')
    await getBooksHttpHandler(req, res)
    verify.calledWith(res.status, 500)
  })
})

describe('add book', () => {
  type AddBookRequest = Request<Record<string, never>, AppError | void, unknown>
  type AddBookResponse = Response<AppError | void>

  let sandbox: SinonSandbox
  let mocked: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    mocked = sandbox.stub(model, 'saveBook')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('empty body', async () => {
    const req = mockReq({
      body: {},
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('missing title', async () => {
    const req = mockReq({
      body: {
        title: '',
        authors: ['Donald E. Knuth'],
        isbn: '0201038064',
        conditions: 'male',
        categories: ['programming', 'computer', 'science'],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('missing isbn', async () => {
    const req = mockReq({
      body: {
        title: 'The Art of Computer Programming',
        authors: ['Donald E. Knuth'],
        isbn: '',
        conditions: 'male',
        categories: ['programming', 'computer', 'science'],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('wrong condition', async () => {
    const req = mockReq({
      body: {
        title: 'The Art of Computer Programming',
        authors: ['Donald E. Knuth'],
        isbn: '0201038064',
        conditions: 'unknown',
        categories: ['programming', 'computer', 'science'],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('empty category', async () => {
    const req = mockReq({
      body: {
        title: 'The Art of Computer Programming',
        authors: ['Donald E. Knuth'],
        isbn: '0201038064',
        conditions: 'unknown',
        categories: ['programming', 'computer', ''],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('empty category', async () => {
    const req = mockReq({
      body: {
        title: 'The Art of Computer Programming',
        authors: [''],
        isbn: '0201038064',
        conditions: 'unknown',
        categories: ['programming', 'computer', 'science'],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 403)
  })

  it('right payload', async () => {
    const req = mockReq({
      body: {
        title: 'The Art of Computer Programming',
        authors: ['Donald E. Knuth'],
        isbn: '0201038064',
        conditions: 'used',
        categories: ['programming', 'computer', 'science'],
      },
    }) as mockReq.MockReq & AddBookRequest
    const res = mockRes() as AddBookResponse & mockRes.MockRes
    res.setHeader = (): AddBookResponse & mockRes.MockRes => {
      return res
    } // HACK (https://github.com/danawoodman/sinon-express-mock/pull/23)
    mocked.returns(TE.right<AppError, Types.ObjectId>(new Types.ObjectId(1)))
    await addBookHttpHandler()(req, res)
    verify.calledWith(res.status, 201)
  })
})
