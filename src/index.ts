import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import * as IO from 'fp-ts/IO'
import { pipe } from 'fp-ts/function'
import { set, connect } from 'mongoose'
import * as core from 'express-serve-static-core'
import buildApp from './app'
import { log } from 'fp-ts/Console'
import { Server } from 'http'
import otel from './monitoring'
import { Config, getConfig } from './config'
set('strictQuery', false)

otel?.start()

const gracefulShutdown = (server: Server) => (): void => {
  console.log('shutting down...')
  server.close(() => {
    console.log('server closed')
    pipe(
      O.fromNullable(otel),
      O.map((x) => {
        return TE.tryCatch(
          () => x.shutdown(),
          () => `error terminating tracing`,
        )
      }),
      O.fold(
        () => T.of(log('no open telemetry client was found')),
        (te) =>
          pipe(
            te,
            TE.fold(
              (e) => T.of(log(`an error has occurred:\n${e}`)),
              () => T.of(log('tracing terminated')),
            ),
          ),
      ),
    )().finally(() => process.exit(0))
  })
  setTimeout(() => {
    console.error(
      'could not close connections in time: forcefully shutting down',
    )
    process.exit(1)
  }, 5000)
}

const start = async (): Promise<void> =>
  (
    await pipe(
      getConfig(process.argv, process.env),
      TE.fromEither,
      TE.mapLeft((errors) =>
        errors.reduce((acc, e) => {
          const path = e.context.map(({ key }) => key).join('.')
          return `${acc}\nproperty '${path}': ${e.message}`
        }, ''),
      ),
      TE.chain((cfg: Config) =>
        pipe(
          TE.tryCatch(
            () => connect(cfg.dbConnectionString),
            () => `could not connect to ${cfg.dbConnectionString}`,
          ),
          TE.chain(() =>
            TE.tryCatch(
              () => buildApp(cfg),
              () => 'cannot build app',
            ),
          ),
          TE.map((app: core.Express) => ({
            server: app.listen(cfg.applicationPort),
            cfg,
          })),
        ),
      ),
      TE.fold(
        (e) =>
          T.of(
            pipe(
              log(`an error has occurred:\n${e}`),
              IO.map(() => {
                process.exit(1)
              }),
            ),
          ),
        ({ server, cfg }) => {
          process.on('SIGTERM', gracefulShutdown(server))
          process.on('SIGINT', gracefulShutdown(server))
          return T.of(
            log(
              `${process.env.npm_package_name} server listening on port ${cfg.applicationPort}`,
            ),
          )
        },
      ),
    )()
  )()

start()
