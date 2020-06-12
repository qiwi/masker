import { isPromiseLike, promisify } from './utils'
import { IExecutionMode } from '@qiwi/substrate'

export const foo = 'bar'

export type IMaskerType = string

export interface IMasker {
  type: IMaskerType
  (context: IMaskerContext): Promise<any>
  sync?: (context: IMaskerContext) => any
}

export interface IMakerPipeSync {
  (input: IMaskerPipeInput): IMaskerPipeOutput
}

export interface IMakerPipeAsync {
  (input: IMaskerPipeInput): Promise<IMaskerPipeOutput>
}

export interface IMaskerPipe {
  exec: IMakerPipeAsync
  execSync: IMakerPipeSync
}

export interface IMaskerPipeOutput {
  value: any
  pipeline?: Array<IMaskerPipe>,
  final?: boolean
}

export interface IMaskerPipeInput extends ISharedContext {
  value: any
  pipeline: Array<IMaskerPipe>
}

export interface IMaskerContext {
  target: any
  next: Function
}

export interface IMaskerRegistry {
  get(type: IMaskerType): IMasker | undefined
  add(type: IMaskerType, masker: IMasker): void
  remove(type: IMaskerType, masker: IMasker): boolean
}

type IExecutorContext = {
  value: any
  pipeline?: Array<IMaskerPipe>
  registry?: any
  refs?: any
  mode?: IExecutionMode
}

type ISharedContext = {
  registry: any
  refs: any,
  execute: IExecutor,
  mode: IExecutionMode
}


export interface IExecutor {
  (context: IExecutorContext): IMaskerPipeOutput | Promise<IMaskerPipeOutput>
  sync: IExecutorSync,
  execSync: IExecutorSync
  exec: IExecutor
}
export type IExecutorSync = (context: IExecutorContext) => IMaskerPipeOutput

export const execute: IExecutor = (context: IExecutorContext) => {
  const {pipeline= [], value, refs = new WeakMap(), registry = new Map(), mode = IExecutionMode.ASYNC} = context
  const pipe = pipeline[0]

  if (!pipe) {
    return context
  }

  const sharedContext: ISharedContext = {refs, registry, execute, mode}
  const fn = mode === IExecutionMode.SYNC ? pipe.execSync : pipe.exec
  const res = fn({
    value,
    pipeline,
    ...sharedContext,
  })

  const next = (res: IMaskerPipeOutput) =>
    res.final
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

export const createPipe = (execSync?: IMakerPipeSync, exec?: IMakerPipeAsync): IMaskerPipe => {
  const _execSync: IMakerPipeSync = execSync || (() => ({value: '****** masker not implemented'}))
  const _exec = exec || promisify(_execSync)

  return {
    execSync: _execSync,
    exec: _exec,
  }
}
