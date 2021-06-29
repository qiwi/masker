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
  registry = new Map(),
  mode = IExecutionMode.ASYNC,
  sync = mode === IExecutionMode.SYNC,
  originPipeline = pipeline,
  context: parent,
  ...rest
}: IRawContext, execute: IExecutor): IEnrichedContext => {
  const id = generateId()
  const parentId = parent?.id
  const _pipeline = normalizePipeline(rest.pipeline || pipeline, registry)
  const _originPipeline = normalizePipeline(rest.originPipeline || originPipeline, registry)
  const pipe = _pipeline[0]
  const opts = pipe?.opts
  const context = {
    value,
    registry,
    sync,
    mode,
    execute,
    opts,
    ...rest,
    pipeline: _pipeline,
    originPipeline: _originPipeline,
    pipe,
    id,
    parentId,
  } as IEnrichedContext
  context.context = context

  return context
}

export const normalizePipeline = (pipeline: IMaskerPipeline, registry: IMaskerRegistry): IMaskerPipelineNormalized =>
  pipeline.map(pipe => getPipe(pipe, registry))
