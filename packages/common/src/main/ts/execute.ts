import {IExecutionMode} from '@qiwi/substrate'
import {
  isPromiseLike,
  generateId,
  clone,
} from './utils'

import {set, get} from 'lodash'
import {getPipe} from './pipe'
import {
  extractMaskerDirectives,
  generateSchema,
} from './schema'

import {
  IExecutor,
  IExecutorSync,
  IRawContext,
  IEnrichedContext,
  IMaskerPipeOutput,
} from './interfaces'

export const execute: IExecutor = (context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context)
  const {schema, pipeline, mode, parent, registry} = sharedContext

  if (schema && !parent) {
    return shortCutExecute(sharedContext)
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

export const shortCutExecute = ({context, schema, value, mode}: IEnrichedContext) => {
  if (!schema) {
    return context
  }

  const _value = clone(value)
  const directives = extractMaskerDirectives(schema)
  const inject = (outputs: IMaskerPipeOutput[]): IMaskerPipeOutput => {
    outputs.forEach(({value}, i) => {
      const path = directives[i]?.[0]
      set(_value, path, value)
    })

    return {...context, value: _value, schema}
  }
  const values = directives.map(([path, directives]) =>
    execute({
      ...context,
      value: get(_value, path),
      pipeline: directives,
    }),
  )

  return mode === IExecutionMode.ASYNC
    ? Promise.all(values).then(inject)
    : inject(values as IMaskerPipeOutput[])
}

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
