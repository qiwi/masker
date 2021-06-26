import {IExecutionMode} from '@qiwi/substrate'
import {ahook} from './utils'

import {
  IExecutor,
  IExecutorSync,
  IEnrichedExecutor,
  IRawContext,
  IEnrichedContext,
  IMaskerPipeOutput,
} from './interfaces'
import {normalizeContext} from './context'

type THookCallback = (res: IMaskerPipeOutput) => ReturnType<IExecutor>

export const enrichExecutor = (execute: IExecutor): IEnrichedExecutor => {
  const execSync = ((opts) => execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync

  Object.assign(execute, {
    sync: execSync,
    execSync,
    exec: execute,
  })

  return execute as IEnrichedExecutor
}

export const execute: IEnrichedExecutor = enrichExecutor((context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context, execute)
  const {pipeline, pipe, mode, execute: _execute, value} = sharedContext
  if (!pipe || (context as IMaskerPipeOutput).final) {
    return context
  }

  const {execSync, exec} = pipe
  const fn = mode === IExecutionMode.SYNC ? execSync : exec
  const next: THookCallback = (res) => _execute({
    ...sharedContext,
    ...res,
    pipeline: res.pipeline || pipeline.slice(1),
  })
  const post: THookCallback = (res) => {
    res.ownValue = value; return res
  }

  return ahook(ahook(fn({...sharedContext}), next), post) // Pipeline inside pipeline executor.
})
