import { recordDeliveryHttpHandler } from '../src/routes/deliveries'
import { Request, Response } from 'express'
import { AppError } from '../src/model'
import { createSandbox, SinonSandbox, SinonStub, assert as verify } from 'sinon'
import { Types } from 'mongoose'
import { mockReq, mockRes } from 'sinon-express-mock'
import * as TE from 'fp-ts/TaskEither'
import * as model from '../src/routes/deliveries/model'

describe('record delivery', () => {
  type RecordDeliveryRequest = Request<
    Record<string, never>,
    AppError | void,
    unknown
  >
  type RecordDeliveryResponse = Response<AppError | void>

  let sandbox: SinonSandbox
  let mocked: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    mocked = sandbox.stub(model, 'recordDelivery')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('empty body', async () => {
    const req = mockReq({
      body: {},
    }) as mockReq.MockReq & RecordDeliveryRequest
    const res = mockRes() as RecordDeliveryResponse & mockRes.MockRes
    await recordDeliveryHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('missing supplier', async () => {
    const req = mockReq({
      body: {
        supplier: '',
        bookIds: ['ABC'],
      },
    }) as mockReq.MockReq & RecordDeliveryRequest
    const res = mockRes() as RecordDeliveryResponse & mockRes.MockRes
    await recordDeliveryHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('empty bookIds', async () => {
    const req = mockReq({
      body: {
        supplier: 'someone',
        bookIds: [''],
      },
    }) as mockReq.MockReq & RecordDeliveryRequest
    const res = mockRes() as RecordDeliveryResponse & mockRes.MockRes
    await recordDeliveryHttpHandler(req, res)
    verify.calledWith(res.status, 403)
  })

  it('right payload', async () => {
    const req = mockReq({
      body: {
        supplier: 'someone',
        bookIds: ['ABC'],
      },
    }) as mockReq.MockReq & RecordDeliveryRequest
    const res = mockRes() as RecordDeliveryResponse & mockRes.MockRes
    res.setHeader = (): RecordDeliveryResponse & mockRes.MockRes => {
      return res
    } // HACK (https://github.com/danawoodman/sinon-express-mock/pull/23)
    mocked.returns(TE.right<AppError, Types.ObjectId>(new Types.ObjectId(1)))
    await recordDeliveryHttpHandler(req, res)
    verify.calledWith(res.status, 201)
  })
})
