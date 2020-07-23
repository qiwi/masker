import {IExecutionMode} from '@qiwi/substrate'
import {IEnrichedContext, IExecutor, IRawContext} from './interfaces'
import {generateId} from './utils'

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
  const context = {value, refs, registry, mode, pipeline, originPipeline, execute, ...rest, parent, id} as IEnrichedContext
  context.context = context

  return context
}
