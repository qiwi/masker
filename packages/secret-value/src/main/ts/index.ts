import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeline,
  IMaskerOpts,
  createPipe,
  SyncGuard,
  IEnrichedContext,
  IMaskerPipeOutput,
  asArray,
  asRegExp,
  execEcho,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'secret-value'

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

export const getDirectives = (opts: TSecretOpts): TSecretDirectiveNormalized[] =>
  (asArray(opts.directives || opts) as TSecretDirectives)
    .map(({keyPattern, valuePattern, pipeline = defaultPipeline}) =>
      ({
        keyPattern: asRegExp(keyPattern),
        valuePattern: asRegExp(valuePattern),
        pipeline,
      }))

export const getPipeline = (value: any, path: string, opts: IMaskerOpts): IMaskerPipeline | undefined =>
  getDirectives({...defaultOpts, ...opts}).find(({valuePattern, keyPattern}) =>
    (valuePattern ? valuePattern.test(value) : true) && (keyPattern ? keyPattern?.test(path) : true))?.pipeline

export const exec = <C extends IEnrichedContext>({value, path, context, execute, opts}: C): SyncGuard<IMaskerPipeOutput, C> => {
  const pipeline = getPipeline(value, path, opts)
  return (pipeline ? execute({...context, pipeline}) : execEcho(context)) as SyncGuard<IMaskerPipeOutput, C>
}

export const pipe: IMaskerPipe = createPipe(name, exec, exec)

export default pipe
