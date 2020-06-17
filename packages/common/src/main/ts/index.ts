import {IExecutionMode} from '@qiwi/substrate'
import {
  isPromiseLike,
  promisify,
  generateId,
  clone,
} from './utils'

import {set, get} from 'lodash'
import {
  extractMaskerDirectives,
  generateSchema,
} from './schema'

import {
  IExecutor,
  IExecutorSync,
  IRawContext,
  IEnrichedContext,
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeSync,
  IMaskerPipeAsync,
  IMaskerPipelineNormalized,
  // IMaskerDirective,
  IMaskerPipeOutput,
  IMaskerPipeDeclaration,
  IMaskerRegistry,
} from './interfaces'

export const foo = 'bar'

export const execute: IExecutor = (context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context)
  const {schema, pipeline, mode, value, parent, registry} = sharedContext

  if (schema && !parent) {
    const _value = clone(value)

    extractMaskerDirectives(schema).forEach(([path, directives]) => {
      set(_value, path, execute.sync({
        ...sharedContext,
        value: get(_value, path),
        pipeline: directives,
      }).value)
    })

    return({...sharedContext, value: _value, schema})
  }

  const pipe = getPipe(pipeline[0], registry)

  if (!pipe) {
    return context
  }

  const {execSync, exec} = pipe.masker
  const fn = mode === IExecutionMode.SYNC ? execSync : exec
  const res = fn(sharedContext)
  const next = (res: IMaskerPipeOutput) => res.final
    ? res
    : execute({
      ...sharedContext,
      ...res,
      pipeline: res.pipeline || pipeline.slice(1),
    })

  const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
    ...res,
    schema: generateSchema({before: sharedContext, after: res, pipe}),
  })

  return isPromiseLike(res)
    ? (res as Promise<IMaskerPipeOutput>).then(next).then(appendSchema)
    : appendSchema(next(res as IMaskerPipeOutput) as IMaskerPipeOutput)
}
const execSync = ((opts) => execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync
execute.sync = execSync
execute.execSync = execSync
execute.exec = execute

export const normalizeContext = ({
  pipeline = [],
  value,
  refs = new WeakMap(),
  registry = new Map(),
  mode = IExecutionMode.ASYNC,
  originPipeline = pipeline,
  schema,
  context: parent,
}: IRawContext): IEnrichedContext => {
  const id = generateId()
  const context = {id, parent, value, refs, registry, execute, mode, pipeline, originPipeline, schema} as IEnrichedContext
  context.context = context

  return context
}

export const getPipe = (pipe: IMaskerPipeDeclaration, registry?: IMaskerRegistry): IMaskerPipelineNormalized | undefined => {
  let masker
  let opts

  if (Array.isArray(pipe)) {
    [masker, opts] = pipe
  }
  else {
    masker = pipe
  }

  if (typeof masker === 'string') {
    masker = registry
      ? registry.get(masker)
      : undefined
  }

  if (!masker) {
    return undefined
  }

  return {
    masker,
    opts,
  }
}

export const createPipe = (name: IMaskerPipeName, execSync?: IMaskerPipeSync, exec?: IMaskerPipeAsync): IMaskerPipe => {
  const _execSync: IMaskerPipeSync = execSync || (() => ({value: '****** masker not implemented'}))
  const _exec = exec || promisify(_execSync)

  return {
    name,
    execSync: _execSync,
    exec: _exec,
  }
}
