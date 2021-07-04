import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  IMaskerPipeline,
  IMaskerOpts,
  createPipe, SyncGuard, IEnrichedContext, IMaskerPipeOutput,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'
import {Extends} from '@qiwi/substrate'

export const name: IMaskerPipeName = 'secret'

export interface TSecretDirective {
  keyPattern?: RegExp | string
  valuePattern?: RegExp | string
  pipeline?: IMaskerPipeline
}

export interface TSecretDirectiveNormalized {
  keyPattern?: RegExp
  valuePattern?: RegExp
  pipeline: IMaskerPipeline
}

export type TSecretDirectives = Array<TSecretDirective>

export type TSecretOpts = TSecretDirective & {directives?: TSecretDirectives}

export const defaultPipeline = [plainPipe]

export const defaultOpts: TSecretOpts = {
  keyPattern: /token|password|credential|secret|private/i,
  pipeline: defaultPipeline,
}

const asArray = <T = any>(value: T): Extends<T, any[], T, T[]> =>
  (Array.isArray(value) ? value : [value]) as Extends<T, any[], T, T[]>

const asRegExp = (value: any): RegExp | undefined =>
  value instanceof RegExp
    ? value
    : typeof value === 'string'
      ? new RegExp(value, 'gi')
      : undefined

export const getDirectives = (opts: TSecretOpts): TSecretDirectiveNormalized[] => {
  const _directives = asArray(opts.directives || opts) as TSecretDirectives

  return _directives.map(({keyPattern, valuePattern, pipeline = defaultPipeline}) =>
    ({
      keyPattern: asRegExp(keyPattern),
      valuePattern: asRegExp(valuePattern),
      pipeline,
    }))
}

export const execEcho = <C extends IMaskerPipeInput>({value, sync}: C): SyncGuard<IMaskerPipeOutput, C> =>
  (sync
    ? {value}
    : Promise.resolve({value})) as SyncGuard<IMaskerPipeInput, C>

export const getPipeline = (value: any, path: string, opts: IMaskerOpts): IMaskerPipeline | undefined =>
  getDirectives({...defaultOpts, ...opts}).find(({valuePattern, keyPattern}) =>
    (valuePattern ? valuePattern.test(value) : true) && (keyPattern ? keyPattern?.test(path) : true))?.pipeline

export const exec = <C extends IEnrichedContext>({value, path, context, execute, opts}: C): SyncGuard<IMaskerPipeOutput, C> => {
  const pipeline = getPipeline(value, path, opts)
  return (pipeline ? execute({...context, pipeline}) : execEcho(context)) as SyncGuard<IMaskerPipeOutput, C>
}

export const pipe: IMaskerPipe = createPipe(name, exec, exec)

export default pipe
