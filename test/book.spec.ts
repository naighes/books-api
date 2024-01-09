import { getBookHttpHandler } from '../src/routes/books'
import { Request, Response } from 'express'
import { Book } from '../src/routes/books/model'
import { AppError } from '../src//model'
import { createSandbox, SinonSandbox, SinonStub, assert as verify } from 'sinon'
import { BookModel, BookSchema } from '../src/routes/books/schema'
import { InferSchemaType, Query } from 'mongoose'
import { mockReq, mockRes } from 'sinon-express-mock'
type TT = InferSchemaType<typeof BookSchema>

describe('get book', () => {
  type GetBookRequest = Request<
    { bookId?: string },
    AppError | (Book & { id: string })
  >
  type GetBookResponse = Response<AppError | (Book & { id: string })>

  let sandbox: SinonSandbox
  let mocked: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    mocked = sandbox.stub(BookModel, 'findById')
  })
  afterEach(() => {
    sandbox.restore()
  })

  it('null result', async () => {
    const req = mockReq({ params: { bookId: 'abc' } }) as mockReq.MockReq &
      GetBookRequest
    const res = mockRes() as GetBookResponse & mockRes.MockRes
    const result = {
      exec: () => new Promise<Array<TT> | null | undefined>((r) => r(null)),
    } as Query<Array<TT>, TT>
    mocked.returns(result)
    await getBookHttpHandler(req, res)
    verify.calledWith(res.status, 404)
  })

  it('db call throwing error', async () => {
    const req = mockReq({ params: { bookId: 'abc' } }) as mockReq.MockReq &
      GetBookRequest
    const res = mockRes() as GetBookResponse & mockRes.MockRes
    mocked.throws('oh my')
    await getBookHttpHandler(req, res)
    verify.calledWith(res.status, 500)
  })
})
