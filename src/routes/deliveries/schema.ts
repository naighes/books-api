import { Timestamp } from 'model'
import { Schema, model } from 'mongoose'
import { Delivery } from './model'

const DeliverySchema = new Schema<Delivery & Timestamp>({
  bookIds: [
    {
      type: String,
    },
  ],
  supplier: {
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

const DeliveryModel = model<typeof DeliverySchema>('Delivery', DeliverySchema)

export { DeliverySchema, DeliveryModel }
