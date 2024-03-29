import {IExecutionMode, Extends} from '@qiwi/substrate'

export interface IMaskerFactoryOpts {
  pipeline?: IMaskerPipeline
  registry?: IMaskerRegistry
  unbox?: boolean
}

export type IMaskerOpts = IMaskerFactoryOpts & IRawContext

export type IMasker = {
  (value: any, opts?: IRawContext): Promise<any>
  sync(value: any, opts?: IRawContext): any
}

export interface IMaskerPipeSync {
  (input: IMaskerPipeInput): IMaskerPipeOutput
}

export interface IMaskerPipeAsync {
  (input: IMaskerPipeInput): Promise<IMaskerPipeOutput>
}

export interface IMaskerPipeDual {
  <C extends IMaskerPipeInput = IMaskerPipeInput>(input: C): SyncGuard<IMaskerPipeOutput, C>
}

export type IMaskerPipeOpts = Record<string, any>

export interface IMaskerPipe {
  name: IMaskerPipeName
  exec: IMaskerPipeAsync | IMaskerPipeDual
  execSync: IMaskerPipeSync | IMaskerPipeDual,
  opts?: IMaskerPipeOpts
}

export interface IMaskerPipeOutput {
  value: any
  _value?: any
  execute?: IEnrichedExecutor
  pipeline?: IMaskerPipeline
  final?: boolean
}

export interface IMaskerPipeInput extends IEnrichedContext {
  value: any
  pipeline: IMaskerPipelineNormalized
}

export type IMaskerRegistry = Map<IMaskerPipeName, IMaskerPipe>

export type IContextId = string

export type IRawContext = {
  value?: any
  _value?: any
  final?: boolean
  context?: IEnrichedContext
  pipeline?: IMaskerPipeline
  registry?: IMaskerRegistry
  sync?: boolean
  mode?: IExecutionMode // Legacy
  originPipeline?: IMaskerPipeline,
  execute?: IEnrichedExecutor
  [key: string]: any
}

export interface IEnrichedContext {
  value: any
  _value?: any
  final?: boolean
  id: IContextId
  parentId?: IContextId
  registry: IMaskerRegistry
  execute: IEnrichedExecutor
  sync: boolean
  mode: IExecutionMode
  opts: IMaskerPipeOpts
  pipe?: IMaskerPipeNormalized
  pipeline: IMaskerPipelineNormalized
  originPipeline: IMaskerPipelineNormalized
  context: IEnrichedContext
  [key: string]: any
}

export interface IExecutor {
  <C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C>
}

export interface IEnrichedExecutor extends IExecutor {
  sync: IExecutorSync
  execSync: IExecutorSync
  exec: IEnrichedExecutor
  id?: string
}
export type IExecutorSync = (context: IRawContext) => IMaskerPipeOutput

export type IMaskerPipeName = string

export type IMaskerPipeRef = IMaskerPipeName | IMaskerPipe

export type IMaskerPipeRefWithOpts = [IMaskerPipeRef, IMaskerPipeOpts]

export type IMaskerPipeDeclaration = IMaskerPipeRef | IMaskerPipeRefWithOpts

export type IMaskerPipeline = Array<IMaskerPipeDeclaration>

export type IMaskerPipeNormalized = IMaskerPipe & {
  opts: IMaskerPipeOpts
}

export type IMaskerPipelineNormalized = Array<IMaskerPipeNormalized>

export interface ISyncSensitive {
  sync?: boolean
}

export type TSyncDirective = boolean | undefined | ISyncSensitive

export type ParseSync<T> = Extends<
  T,
  boolean | undefined,
  T,
  T extends ISyncSensitive ? T['sync'] : never
  >

export type SyncGuard<V, S extends TSyncDirective> = Extends<
  S,
  { sync: true } | true,
  Extends<V, Promise<any>, never, V>,
  Extends<V, Promise<any>, V, Promise<V>>
  >
