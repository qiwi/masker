import {IExecutionMode} from '@qiwi/substrate'
import {
  isPromiseLike,
} from './utils'

import {
  IExecutor,
  IExecutorSync,
  IRawContext,
  IEnrichedContext,
  IMaskerPipeOutput,
} from './interfaces'
import {normalizeContext} from './context'

export const execute: IExecutor = (context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context, execute)
  const {pipeline, mode} = sharedContext

  const pipe = pipeline[0]

  if (!pipe) {
    return context
  }

  const {execSync, exec} = pipe
  const fn = mode === IExecutionMode.SYNC ? execSync : exec
  const res = fn(sharedContext)
  const next = (res: IMaskerPipeOutput) => res.final
    ? res
    : execute({
      ...sharedContext,
      ...res,
      pipeline: res.pipeline || pipeline.slice(1),
    })

  return isPromiseLike(res)
    ? (res as Promise<IMaskerPipeOutput>).then(next)
    : next(res as IMaskerPipeOutput)
}
const execSync = ((opts) => execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync
execute.sync = execSync
execute.execSync = execSync
execute.exec = execute
