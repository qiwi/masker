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
import {createPipe} from './pipe'

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
  const {pipeline, pipe, mode, execute: _execute, sync, final} = sharedContext

  const exec: THookCallback = () => {
    if (!pipe || final) {
      return hook(context, v => v)
    }

    const {execSync, exec} = pipe
    const fn = mode === IExecutionMode.SYNC || sync ? execSync : exec
    return fn(sharedContext)
  }
  const next: THookCallback = (res) => {
    const _ctx = {
      ...sharedContext,
      ...res,
      execute: res.execute || _execute,
      pipeline: res.pipeline || pipeline.slice(1),
    }

    return (_ctx.final || _ctx.pipeline.length === 0)
      ? hook(_ctx, v => v)
      : _ctx.execute(_ctx)
  }

  let _value: any
  const pre: THookCallback = (res) => {
    _value = res.value; return res
  }
  const post: THookCallback = (res) => {
    res._value = _value; return res
  }

  return hook(hook(hook(exec(sharedContext), pre), next), post) // Pipeline inside pipeline executor.
})

export type TExecutorHook = (ctx: IMaskerPipeInput) => IEnrichedExecutor

export const patchExecutor = (execHook: TExecutorHook, name: IMaskerPipeName) => <C extends IMaskerPipeInput>(ctx: C): SyncGuard<IMaskerPipeInput, C> => {
  ctx.execute = execHook(ctx)
  ctx.originPipeline = ctx.originPipeline.filter((pipe) => pipe.name !== name)
  ctx.pipeline = ctx.pipeline.filter((pipe) => pipe.name !== name)

  // To let exec-patch be self-invoked
  if (ctx.pipeline.length === 0) {
    ctx.pipeline = [createPipe('echo', (v: any) => v)]
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ctx.context = undefined

  return (ctx.sync ? ctx : Promise.resolve(ctx)) as unknown as SyncGuard<IMaskerPipeInput, C>
}

export const execEcho = <C extends IMaskerPipeInput>({value, sync}: C): SyncGuard<IMaskerPipeOutput, C> =>
  (sync
    ? {value}
    : Promise.resolve({value})) as SyncGuard<IMaskerPipeOutput, C>
