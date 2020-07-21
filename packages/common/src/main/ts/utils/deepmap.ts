export function mapper(
  deep: boolean,
  input: any,
  fn: (input: any, key?: string) => any,
  refs = new WeakMap(),
  key?: string,
) {
  if (typeof input === 'object' && input !== null) {
    const ref = refs.get(input)
    if (ref) {
      return ref
    }
    const isArr = Array.isArray(input)
    const n: Record<string, any> = isArr ? [] : {}
    refs.set(input, n)

    const descriptors = Object.getOwnPropertyDescriptors(input)
    for (const i in descriptors) {
      const descriptor = descriptors[i]

      if (isArr && i === 'length') {
        continue
      }

      if (Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        Object.defineProperty(n, i, {
          ...descriptor,
          value: deep
            ? mapper(deep, descriptor.value, fn, refs, i)
            : fn(descriptor.value, i)
        })
      }
    }
    Object.setPrototypeOf(n, Object.getPrototypeOf(input))

    return n
  }
  return fn(input, key)
}

export const deepMap = mapper.bind(null, true)

export const mapValues = mapper.bind(null, false)
