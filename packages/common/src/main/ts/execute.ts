import {IExecutionMode} from '@qiwi/substrate'
import {ahook} from './utils'

import {
  IExecutor,
  IExecutorSync,
  IRawContext,
  IEnrichedContext,
  IMaskerPipeOutput,
} from './interfaces'
import {normalizeContext} from './context'

type THookCallback = (res: IMaskerPipeOutput) => ReturnType<IExecutor>

export const execute: IExecutor = (context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context, execute)
  const {pipeline, mode, execute: _execute} = sharedContext
  const pipe = pipeline[0]

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

  let memo: any
  const m1: THookCallback = (res) => ((memo = res.value), res)
  const m2: THookCallback = (res) => ((res.memo = memo), res)

  return ahook(ahook(ahook(fn(sharedContext), m1), next), m2) // Pipeline inside pipeline executor.
}

const execSync = ((opts) => execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync
execute.sync = execSync
execute.execSync = execSync
execute.exec = execute
