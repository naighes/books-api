import { Timestamp } from 'model'
import { Schema, model } from 'mongoose'
import { Order } from './model'

const OrderSchema = new Schema<Order & Timestamp>({
  bookIds: [
    {
      type: String,
    },
  ],
  purchaser: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
})

const OrderModel = model<typeof OrderSchema>('Order', OrderSchema)

export { OrderSchema, OrderModel }
