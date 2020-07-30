import {IExecutionMode} from '@qiwi/substrate'

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

export interface IMaskerPipe {
  name: IMaskerPipeName
  exec: IMaskerPipeAsync
  execSync: IMaskerPipeSync
}

export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerOpts]

export type IMaskerDirectives = Array<IMaskerDirective>

export interface IMaskerPipeOutput {
  value: any
  memo?: any
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
  memo?: any
  schema?: IMaskerSchema
  context?: IEnrichedContext
  parent?: IEnrichedContext
  pipeline?: IMaskerPipeline
  registry?: IMaskerRegistry
  refs?: any
  mode?: IExecutionMode
  originPipeline?: IMaskerPipeline,
  execute?: IEnrichedExecutor
}

export type IEnrichedContext = {
  value: any
  memo?: any
  id: IContextId
  registry: IMaskerRegistry
  refs: any
  execute: IEnrichedExecutor
  mode: IExecutionMode
  pipeline: IMaskerPipelineNormalized
  originPipeline: IMaskerPipelineNormalized
  context: IEnrichedContext
  parent: IEnrichedContext
  schema?: IMaskerSchema
}

export interface IExecutor {
  (context: IRawContext): IMaskerPipeOutput | Promise<IMaskerPipeOutput>
}

export interface IEnrichedExecutor extends IExecutor {
  (context: IRawContext): IMaskerPipeOutput | Promise<IMaskerPipeOutput>
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
  maskerDirectives?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema> | Array<IMaskerSchema>
}

export type IMaskerPipeName = string

export type IMaskerPipeRef = IMaskerPipeName | IMaskerPipe

export type IMaskerOpts = Record<string, any>

export type IMaskerPipeRefWithOpts = [IMaskerPipeRef, IMaskerOpts]

export type IMaskerPipeDeclaration = IMaskerPipeRef | IMaskerPipeRefWithOpts

export type IMaskerPipeline = Array<IMaskerPipeDeclaration>

export type IMaskerPipeNormalized = IMaskerPipe & {
  opts?: IMaskerOpts
}

export type IMaskerPipelineNormalized = Array<IMaskerPipeNormalized>
