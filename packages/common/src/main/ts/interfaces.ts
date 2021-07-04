import {IExecutionMode, Extends} from '@qiwi/substrate'

export type IMaskerType = string

export interface IMasker {
  type: IMaskerType
  (context: IMaskerContext): Promise<any>
  sync?: (context: IMaskerContext) => any
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

export type IMaskerOpts = Record<string, any>

export interface IMaskerPipe {
  name: IMaskerPipeName
  exec: IMaskerPipeAsync | IMaskerPipeDual
  execSync: IMaskerPipeSync | IMaskerPipeDual
}
export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerOpts]

export type IMaskerDirectives = Array<IMaskerDirective>

export interface IMaskerPipeOutput {
  value: any
  _value?: any
  execute?: IEnrichedExecutor
  pipeline?: IMaskerPipeline
  final?: boolean
  schema?: IMaskerSchema
}

export interface IMaskerPipeInput extends IEnrichedContext {
  value: any
  pipeline: IMaskerPipelineNormalized
}

export interface IMaskerContext {
  target: any
  next: Function
}

export type IMaskerRegistry = Map<IMaskerPipeName, IMaskerPipe>

export type IContextId = string

export type IRawContext = {
  value: any
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
  id: IContextId
  parentId?: IContextId
  registry: IMaskerRegistry
  execute: IEnrichedExecutor
  sync: boolean
  mode: IExecutionMode
  opts: IMaskerOpts
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
  <C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C>
  sync: IExecutorSync
  execSync: IExecutorSync
  exec: IEnrichedExecutor
  id?: string
}
export type IExecutorSync = (context: IRawContext) => IMaskerPipeOutput

export type ISchemaContext = {
  before: IMaskerPipeInput,
  after: IMaskerPipeOutput,
  pipe: IMaskerPipeNormalized
}

export type IMaskerSchema = {
  type: any
  valueDirectives?: Array<IMaskerDirective>
  keyDirectives?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema> | Array<IMaskerSchema>
}

export type IMaskerPipeName = string

export type IMaskerPipeRef = IMaskerPipeName | IMaskerPipe

export type IMaskerPipeRefWithOpts = [IMaskerPipeRef, IMaskerOpts]

export type IMaskerPipeDeclaration = IMaskerPipeRef | IMaskerPipeRefWithOpts

export type IMaskerPipeline = Array<IMaskerPipeDeclaration>

export type IMaskerPipeNormalized = IMaskerPipe & {
  opts: IMaskerOpts
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
