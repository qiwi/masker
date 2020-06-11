export type IMaskerType = string

export interface IMasker {
  type: IMaskerType
  (context: IMaskerContext): Promise<any>
  sync?: (context: IMaskerContext) => any
}

export interface IMaskerContext {
  target: any,
  next: Function
}

export interface IMaskerRegistry {
  get(type: IMaskerType): IMasker | undefined
  add(type: IMaskerType, masker: IMasker): void
  remove(type: IMaskerType, masker: IMasker): boolean
}
