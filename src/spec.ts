import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: {
    version: process.env.npm_package_version,
    title: process.env.npm_package_name,
    description: 'books stock helper',
  },
  components: {
    schemas: {
      registerWebHook: {
        $url: 'http://localhost:3001',
      },
      placeOrder: {
        $purchaser: 'Benjamin C. Pierce',
        $bookIds: ['ABC', '123'],
      },
      recordDelivery: {
        $supplier: 'Benjamin C. Pierce',
        $bookIds: ['ABC', '123'],
      },
      findBooks: {
        $books: [
          {
            $title: 'Types and Programming Languages',
            $isbn: '0262162091',
            $conditions: 'new',
            $authors: ['Benjamin C. Pierce'],
            $categories: ['programming', 'computer', 'science'],
          },
        ],
      },
      findBook: {
        $title: 'Types and Programming Languages',
        $isbn: '0262162091',
        $conditions: 'new',
        $authors: ['Benjamin C. Pierce'],
        $categories: ['programming', 'computer', 'science'],
      },
      saveBook: {
        $title: 'Types and Programming Languages',
        $isbn: '0262162091',
        $conditions: 'new',
        $authors: ['Benjamin C. Pierce'],
        $categories: ['programming', 'computer', 'science'],
      },
      bookAvailability: {
        $count: 4,
      },
    },
  },
}

const outputFile = './spec.json'
const endpointsFiles = ['./src/app.ts']

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc)
