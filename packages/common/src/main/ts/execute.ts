import {IExecutionMode} from '@qiwi/substrate'
import {ahook} from './utils'

import {IEnrichedContext, IEnrichedExecutor, IExecutor, IMaskerPipeOutput, IRawContext, SyncGuard} from './interfaces'
import {normalizeContext} from './context'

type THookCallback = (res: IMaskerPipeOutput) => ReturnType<IExecutor>

export const enrichExecutor = (execute: IExecutor): IEnrichedExecutor => {
  const execSync = ((opts: IRawContext) => execute({...opts, sync: true, mode: IExecutionMode.SYNC}))

  Object.assign(execute, {
    sync: execSync,
    execSync,
    exec: execute,
  })

  return execute as IEnrichedExecutor
}

export const execute: IEnrichedExecutor = enrichExecutor(<C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C> => {
  const sharedContext: IEnrichedContext = normalizeContext(context, execute)
  const {pipeline, pipe, mode, execute: _execute, sync} = sharedContext
  if (!pipe || (context as IMaskerPipeOutput).final) {
    return ahook(context, v => v)
  }

  const {execSync, exec} = pipe
  const fn = mode === IExecutionMode.SYNC || sync ? execSync : exec
  const next: THookCallback = (res) => _execute({
    ...sharedContext,
    ...res,
    pipeline: res.pipeline || pipeline.slice(1),
  })

  let _value: any
  const pre: THookCallback = (res) => {
    _value = res.value; return res
  }
  const post: THookCallback = (res) => {
    res.ownValue = _value; return res
  }

  return ahook(ahook(ahook(fn({...sharedContext}), pre), next), post) // Pipeline inside pipeline executor.
})
