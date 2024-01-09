# booksland

This repository showcases a sample application that explores a cloud-native model. It incorporates [fp-ts](https://github.com/gcanti/fp-ts) and [io-ts](https://github.com/gcanti/io-ts) for a robust foundation. Additionally, the codebase utilizes infrastructure components such as Docker, Prometheus, and [OpenTelemetry](https://opentelemetry.io/).

## use case

A bookstore owner wants a very rudimentary software she can use to keep track of stock. She has to add books to the stock if she receives a delivery and she wants to delete books from stock if they are bought. Furthermore, she wants to get notified if a book is running out of stock so she can order more.

## building, running, etc...

You can build the project by launching `npm run build`.
Within the project, you'll find a Docker Compose descriptor file that enables you to leverage the project's infrastructure directly from your local machine. So, just run `docker compose up`.

## configuration

The application is configurable through environment variables or command-line arguments.

* `APPLICATION_PORT` / `--applicationPort`: the application listening port.
* `DB_CONNECTION_STRING` / `--dbConnectionString`: the MongoDB connection string.
* `METRICS_PORT` / `--metricsPort`: the port for metrics scraping.
* `BASE_URL` / `--baseUrl`: the application base URL (e.g. `http://localhost:3001`).
* `OTLP_EXPORTER_HOST` / `--otlpExporterHost`: the host for the OTLP exporter.
* `OTLP_EXPORTER_PORT` / `--otlpExporterPort`: the port for the OTLP exporter.

## documentation

Run `npm run doc` to generate API documentation (specifications are contained in the **./src/spec.json** file).

## notifications

For the use case of notifications, a simple mechanism based on webhooks paired with [MongoDB change streams](https://www.mongodb.com/docs/manual/changeStreams/) has been implemented. This avoids the need to involve additional infrastructure.

## metrics and tracing

With Docker Compose, instances of [Jaeger](https://www.jaegertracing.io) and [Prometheus](https://prometheus.io) are provided, accessible at `http://localhost:9090` and `http://localhost:16686`, respectively.

## example of curls

```sh
# adding a book
curl -v \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"title":"Types and Programming Languages","isbn":"0262162091","conditions":"new","authors":["Benjamin C. Pierce"],"categories":["computer", "science"]}' \
  http://localhost:3001/books

# < HTTP/1.1 201 Created
# < Location: http://localhost:3001/books/65a8d01d0ee1676f846c8ce8
# < ...
```

```sh
# placing an order
curl -v \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"purchaser":"Alonzo Church","bookIds":["65a8d01d0ee1676f846c8ce8"]}' \
  http://localhost:3001/orders

# < HTTP/1.1 201 Created
# < ...
```

```sh
# recording a delivery
curl -v \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"supplier":"Bertrand Russell","bookIds":["65a8e03ee4c7cfd6244f82e7"]}' \
  http://localhost:3001/deliveries

# < HTTP/1.1 201 Created
# < ...
```

```sh
# retrieving book availability
curl -v -X GET http://localhost:3001/books/65a8d01d0ee1676f846c8ce8/availability

# < HTTP/1.1 200 OK
# < ...
# {"count":1}
```

```sh
# registering a webhook
curl -v \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"url":"http://localhost:3003"}' \
  http://localhost:3001/webhooks

# < HTTP/1.1 201 OK
# < ...
```
