export const promisify = (fn: Function) => (...args: any[]) => Promise.resolve(fn(...args))

export {deepMap} from './deepmap'

export const isPromiseLike = (target: any): boolean =>
  !!target && typeof target.then === 'function' && typeof target.catch === 'function'

export const isEqual = (a: any, b: any): boolean => a === b

export const generateId = () => (Math.random() + '').slice(-8)

export const mapValues = (
  input: any,
  fn: (input: any, key?: string) => any,
  refs = new WeakMap(),
  key?: string,
) => {
  if (typeof input === 'object' && input !== null) {
    const ref = refs.get(input)
    if (ref) {
      return ref
    }
    const n: Record<string, any> = Array.isArray(input) ? [] : {}
    refs.set(input, n)
    for (const i in input) {
      if (Object.prototype.hasOwnProperty.call(input, i)) {
        n[i] = fn(input[i], i)
      }
    }
    return n
  }
  return fn(input, key)
}

