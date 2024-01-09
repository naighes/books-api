import * as O from 'fp-ts/Option'
import * as A from 'fp-ts/Array'
import { pipe } from 'fp-ts/function'
import { ConfigCodec } from './codecs'
import { Validation } from 'io-ts'

type Config = {
  dbConnectionString: string
  applicationPort: number
  metricsPort: number
  otlpExporterHost: string
  otlpExporterPort: number
  baseUrl: string
}

const toUnderscore = (value: string): string =>
  value
    .replace(/\B([A-Z]|[0-9]+)/g, '_$1')
    .replace(/__/g, '_')
    .toUpperCase()

const findInArgs = (
  source: Array<string>,
  key: string,
): O.Option<[string, string]> =>
  pipe(
    A.findIndex((x) => x === `--${key}`)(source),
    O.chain(O.fromPredicate((index) => index + 1 < source.length)),
    O.chain((index) =>
      pipe(
        O.fromNullable(source[index]),
        O.chain(() =>
          pipe(
            O.fromNullable(source[index + 1]),
            O.map<string, [string, string]>((value: string) => [key, value]),
          ),
        ),
      ),
    ),
  )

const findInEnv = (
  source: Record<string, string | undefined>,
  key: string,
): O.Option<[string, string]> => {
  const k = toUnderscore(key)
  return pipe(
    O.fromNullable(k),
    O.chain(() =>
      pipe(
        O.fromNullable(source[k]),
        O.map<string, [string, string]>((value: string) => [key, value]),
      ),
    ),
  )
}

const getConfig = (
  args: Array<string>,
  env: Record<string, string | undefined>,
): Validation<Config> =>
  pipe(
    [
      'dbConnectionString',
      'applicationPort',
      'metricsPort',
      'otlpExporterHost',
      'otlpExporterPort',
      'baseUrl',
    ],
    A.map((key) => O.orElse(findInArgs(args, key), () => findInEnv(env, key))),
    A.compact,
    A.reduce<[string, string], Record<string, string>>({}, (acc, [k, v]) => ({
      ...acc,
      [k]: v,
    })),
    (s: Record<string, string>) => ConfigCodec.decode(s),
  )

export { Config, getConfig }
