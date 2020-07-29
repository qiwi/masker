import {IExecutionMode} from '@qiwi/substrate'
import {
    IEnrichedContext,
    IExecutor,
    IMaskerPipeline,
    IMaskerPipelineNormalized,
    IMaskerRegistry,
    IRawContext,
} from './interfaces'
import {generateId} from './utils'
import {getPipe} from './pipe'

export const normalizeContext = ({
   pipeline = [],
   value,
   refs = new WeakMap(),
   registry = new Map(),
   mode = IExecutionMode.ASYNC,
   originPipeline = pipeline,
   context: parent,
   ...rest
 }: IRawContext, execute: IExecutor): IEnrichedContext => {
  const id = generateId()
  const context = {
    value,
    refs,
    registry,
    mode,
    pipeline: normalizePipeline(pipeline, registry),
    originPipeline: normalizePipeline(originPipeline, registry),
    execute,
    ...rest,
    parent,
    id,
  } as IEnrichedContext
  context.context = context

  return context
}

export const normalizePipeline = (pipeline: IMaskerPipeline, registry: IMaskerRegistry): IMaskerPipelineNormalized =>
  pipeline.map(pipe => getPipe(pipe, registry))
