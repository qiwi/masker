// import once from 'lodash.once'

export const foo = 'bar'

export type IMaskerType = string

export interface IMasker {
  type: IMaskerType
  (context: IMaskerContext): Promise<any>
  sync?: (context: IMaskerContext) => any
}

export interface IMakerPipe {
  (input: IMaskerPipeInput): IMaskerPipeOutput
}

export interface IMaskerPipeOutput {
  value: any
  pipeline?: Array<IMakerPipe>,
  final?: boolean
}

export interface IMaskerPipeInput extends ISharedContext {
  value: any
  pipeline: Array<IMakerPipe>
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
  pipeline?: Array<IMakerPipe>
  registry?: any
  refs?: any
}

type ISharedContext = {
  registry: any
  refs: any,
  execute: IExecutor
}

export type IExecutor = (context: IExecutorContext) => IMaskerPipeOutput

export const execute: IExecutor = (context: IExecutorContext): IMaskerPipeOutput => {
  const {pipeline=[], value, refs = new WeakMap(), registry = new Map()} = context
  const pipe = pipeline[0]

  if (!pipe) {
    return context
  }

  const sharedContext: ISharedContext = {refs, registry, execute}
  const res = pipe({
    value,
    pipeline,
    ...sharedContext,
  })

  return res.final
    ? res
    : execute({
      ...sharedContext,
      ...res,
      pipeline: res.pipeline || pipeline.slice(1),
    })
}
