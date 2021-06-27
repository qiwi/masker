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

export type IMaskerOpts = Record<string, any>

export interface IMaskerPipe {
  name: IMaskerPipeName
  exec: IMaskerPipeAsync
  execSync: IMaskerPipeSync
}
export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerOpts]

export type IMaskerDirectives = Array<IMaskerDirective>

export interface IMaskerPipeOutput {
  value: any
  ownValue?: any
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
  ownValue?: any
  schema?: IMaskerSchema
  final?: boolean
  context?: IEnrichedContext
  parent?: IEnrichedContext
  pipeline?: IMaskerPipeline
  registry?: IMaskerRegistry
  refs?: any
  sync?: boolean
  mode?: IExecutionMode
  originPipeline?: IMaskerPipeline,
  execute?: IEnrichedExecutor
  [key: string]: any
}

export type IEnrichedContext = {
  value: any
  ownValue?: any
  id: IContextId
  registry: IMaskerRegistry
  refs: any
  execute: IEnrichedExecutor
  sync: boolean
  mode: IExecutionMode
  opts: IMaskerOpts
  pipe?: IMaskerPipeNormalized
  pipeline: IMaskerPipelineNormalized
  originPipeline: IMaskerPipelineNormalized
  context: IEnrichedContext
  parent: IEnrichedContext
  schema?: IMaskerSchema
  [key: string]: any
}

export interface IExecutor {
  <C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C>
}

// <C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C>

export interface IEnrichedExecutor extends IExecutor {
  <C extends IRawContext>(context: C): SyncGuard<IMaskerPipeOutput, C>
  sync: IExecutorSync
  execSync: IExecutorSync
  exec: IEnrichedExecutor
  opts: IMaskerOpts,
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
