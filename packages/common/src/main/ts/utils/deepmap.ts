export function deepMap (
  input: any,
  fn: (input: Record<string, any>, key?: string) => any,
  refs = new WeakMap(),
  key?: string
) {
  if (typeof input === 'object' && input !== null) {
    const ref = refs.get(input)
    if (ref) {
      return ref
    }
    const n: Record<string, any> = Array.isArray(input) ? [] : {}
    refs.set(input, n)
    for (const i in input) {
      if (Object.prototype.hasOwnProperty.call(input, i)) {
        n[i] = deepMap(input[i], fn, refs, i)
      }
    }
    return n
  }
  return fn(input, key)
}
