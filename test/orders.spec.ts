import { placeOrderHttpHandler } from '../src/routes/orders'
import { Request, Response } from 'express'
import { AppError } from '../src/model'
import { createSandbox, SinonSandbox, SinonStub, assert as verify } from 'sinon'
import { Types } from 'mongoose'
import { mockReq, mockRes } from 'sinon-express-mock'
import * as TE from 'fp-ts/TaskEither'
import * as model from '../src/routes/orders/model'

describe('record order', () => {
  type RecordOrderRequest = Request<
    Record<string, never>,
    AppError | void,
    unknown
  >
  type RecordOrderResponse = Response<AppError | void>

  let sandbox: SinonSandbox
  let mocked: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    mocked = sandbox.stub(model, 'placeOrder')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('empty body', async () => {
    const req = mockReq({
      body: {},
    }) as mockReq.MockReq & RecordOrderRequest
    const res = mockRes() as RecordOrderResponse & mockRes.MockRes
    await placeOrderHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('missing purchaser', async () => {
    const req = mockReq({
      body: {
        purchaser: '',
        bookIds: ['ABC'],
      },
    }) as mockReq.MockReq & RecordOrderRequest
    const res = mockRes() as RecordOrderResponse & mockRes.MockRes
    await placeOrderHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('empty bookIds', async () => {
    const req = mockReq({
      body: {
        purchaser: 'someone',
        bookIds: [''],
      },
    }) as mockReq.MockReq & RecordOrderRequest
    const res = mockRes() as RecordOrderResponse & mockRes.MockRes
    await placeOrderHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('right payload', async () => {
    const req = mockReq({
      body: {
        purchaser: 'someone',
        bookIds: ['ABC'],
      },
    }) as mockReq.MockReq & RecordOrderRequest
    const res = mockRes() as RecordOrderResponse & mockRes.MockRes
    res.setHeader = (): RecordOrderResponse & mockRes.MockRes => {
      return res
    } // HACK (https://github.com/danawoodman/sinon-express-mock/pull/23)
    mocked.returns(TE.right<AppError, Types.ObjectId>(new Types.ObjectId(1)))
    await placeOrderHttpHandler(req, res)
    verify.calledWith(res.status, 201)
  })
})
