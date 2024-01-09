import { Schema, model } from 'mongoose'
import { ALL_CONDITIONS, Book } from './model'
import { Timestamp } from 'model'

const BookSchema = new Schema<Book & Timestamp>({
  title: {
    type: String,
    required: true,
  },
  isbn: {
    type: String,
    required: true,
  },
  conditions: {
    type: String,
    required: true,
    enum: ALL_CONDITIONS,
  },
  authors: [
    {
      type: String,
    },
  ],
  categories: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
})

const BookModel = model<typeof BookSchema>('Book', BookSchema)

export { BookSchema, BookModel }
