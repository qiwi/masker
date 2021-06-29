import {IExecutionMode} from '@qiwi/substrate'
import {hook} from './utils'

import {
  IEnrichedContext,
  IEnrichedExecutor,
  IExecutor,
  IMaskerPipeInput,
  IMaskerPipeName,
  IMaskerPipeOutput,
  IRawContext,
  SyncGuard,
} from './interfaces'
import {normalizeContext} from './context'

export type THookCallback = (res: IMaskerPipeOutput) => ReturnType<IExecutor>

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
    return hook(context, v => v)
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
    res._value = _value; return res
  }

  return hook(hook(hook(fn({...sharedContext}), pre), next), post) // Pipeline inside pipeline executor.
})

export type TExecutorHook = (ctx: IMaskerPipeInput) => IEnrichedExecutor

export const patchExecutor = (execHook: TExecutorHook, name: IMaskerPipeName) => <C extends IMaskerPipeInput>(ctx: C): SyncGuard<IMaskerPipeInput, C> => {
  ctx.execute = execHook(ctx)
  ctx.originPipeline = ctx.originPipeline.filter((pipe) => pipe.name !== name)
  ctx.pipeline = ctx.pipeline.filter((pipe) => pipe.name !== name)

  // @ts-ignore
  ctx.context = undefined

  return ctx.execute(ctx) as SyncGuard<IMaskerPipeInput, C>
}
