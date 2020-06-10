export const foo = 'bar'

export const maskerFactory = (...maskers: any[]) => {
  const context = createMaskerContext()

  maskers.forEach((masker) => context.registry.set(masker.type, masker))

  const self = (target: any) =>
    [...context.registry.values()].reduce((memo, masker) => {
      return masker({
        memo,
        next: self
      })
    }, target)

  return self
}

export const createMaskerContext = () => ({
  registry: new Map(),
  refs: new WeakMap(),
})
