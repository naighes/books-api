import { Timestamp } from 'model'
import { Schema, model } from 'mongoose'
import { WebHook } from './model'

const WebHookSchema = new Schema<WebHook & Timestamp>({
  url: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
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

const WebHookModel = model<typeof WebHookSchema>('WebHook', WebHookSchema)

export { WebHookSchema, WebHookModel }
