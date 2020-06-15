import {IExecutionMode} from '@qiwi/substrate'
import {
  isPromiseLike,
  promisify,
  isEqual,
  generateId,
} from './utils'

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
  name: IMaskerPipeName
  exec: IMakerPipeAsync
  execSync: IMakerPipeSync
}

export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerOpts]

export interface IMaskerPipeOutput {
  value: any
  pipeline?: IMaskerPipeline
  final?: boolean
  schema?: IMaskerSchema
}

export interface IMaskerPipeInput extends IEnrichedContext {
  value: any
  pipeline: IMaskerPipeline
}

export interface IMaskerContext {
  target: any
  next: Function
}

export type IMaskerRegistry = Map<IMaskerPipeName, IMaskerPipe>

export type IContextId = string

export type IMaskerSharedRefs = Map<IContextId, any>

type IRawContext = {
  value: any
  context?: IEnrichedContext
  pipeline?: IMaskerPipeline
  registry?: IMaskerRegistry
  refs?: any
  mode?: IExecutionMode
  originPipeline?: IMaskerPipeline
}

type IEnrichedContext = {
  value: any,
  id: IContextId
  registry: IMaskerRegistry
  refs: any
  execute: IExecutor
  mode: IExecutionMode
  pipeline: IMaskerPipeline
  originPipeline: IMaskerPipeline
  context: IEnrichedContext
  schema?: IMaskerSchema
}

export interface IExecutor {
  (context: IRawContext): IMaskerPipeOutput | Promise<IMaskerPipeOutput>
  sync: IExecutorSync
  execSync: IExecutorSync
  exec: IExecutor
  id?: string
}
export type IExecutorSync = (context: IRawContext) => IMaskerPipeOutput

export const execute: IExecutor = (context: IRawContext) => {
  const sharedContext: IEnrichedContext = normalizeContext(context)
  const {pipeline, mode} = sharedContext
  const pipe = getPipe(pipeline[0])

  if (!pipe) {
    return context
  }

  const {execSync, exec} = pipe.masker
  const fn = mode === IExecutionMode.SYNC ? execSync : exec
  const res = fn(sharedContext)
  const next = (res: IMaskerPipeOutput) => res.final
    ? res
    : execute({
      ...sharedContext,
      ...res,
      pipeline: res.pipeline || pipeline.slice(1),
    })

  const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
    ...res,
    schema: generateSchema({before: sharedContext, after: res, pipe}),
  })

  return isPromiseLike(res)
    ? (res as Promise<IMaskerPipeOutput>).then(next).then(appendSchema)
    : appendSchema(next(res as IMaskerPipeOutput) as IMaskerPipeOutput)
}
const execSync = ((opts) => execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync
execute.sync = execSync
execute.execSync = execSync
execute.exec = execute

export const normalizeContext = ({
  pipeline = [],
  value,
  refs = new WeakMap(),
  registry = new Map(),
  mode = IExecutionMode.ASYNC,
  originPipeline = pipeline,
}: IRawContext): IEnrichedContext => {
  const id = generateId()
  const context = {id, value, refs, registry, execute, mode, pipeline, originPipeline} as IEnrichedContext
  context.context = context

  return context
}

export type ISchemaContext = {
  before: IMaskerPipeInput,
  after: IMaskerPipeOutput,
  pipe: IMaskerPipelineNormalized
}

const generateSchema = ({before, after, pipe: {masker: {name}}}: ISchemaContext): IMaskerSchema => {
  const type = getSchemaType(before.value)
  const schema: IMaskerSchema = {
    type,
    ...after.schema,
  }

  if (type !== 'object' && !isEqual(before.value, after.value)) {
    schema.maskerDirectives = after?.schema?.maskerDirectives || []
    schema.maskerDirectives.push(name)
  }

  return schema
}

const getSchemaType = (value: any): string =>
  typeof value === 'string'
    ? 'string'
    : typeof value === 'object' && value !== null
      ? 'object'
      : 'unknown'

export type IMaskerSchema = {
  type: any
  maskerDirectives?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema>
}

export type IMaskerPipeName = string

export type IMaskerPipeRef = IMaskerPipeName | IMaskerPipe

export type IMaskerOpts = Record<string, any>

export type IMaskerPipeRefWithOpts = [IMaskerPipeRef, IMaskerOpts]

export type IMaskerPipeDeclaration = IMaskerPipeRef | IMaskerPipeRefWithOpts

export type IMaskerPipeline = Array<IMaskerPipeDeclaration>

export type IMaskerPipelineNormalized = {
  masker: IMaskerPipe,
  opts?: IMaskerOpts
}

export const getPipe = (pipe: IMaskerPipeDeclaration, registry?: IMaskerRegistry): IMaskerPipelineNormalized | undefined => {
  let masker
  let opts

  if (Array.isArray(pipe)) {
    [masker, opts] = pipe
  }
  else {
    masker = pipe
  }

  if (typeof masker === 'string') {
    masker = registry
      ? registry.get(masker)
      : undefined
  }

  if (!masker) {
    return undefined
  }

  return {
    masker,
    opts,
  }
}

export const createPipe = (name: IMaskerPipeName, execSync?: IMakerPipeSync, exec?: IMakerPipeAsync): IMaskerPipe => {
  const _execSync: IMakerPipeSync = execSync || (() => ({value: '****** masker not implemented'}))
  const _exec = exec || promisify(_execSync)

  return {
    name,
    execSync: _execSync,
    exec: _exec,
  }
}
