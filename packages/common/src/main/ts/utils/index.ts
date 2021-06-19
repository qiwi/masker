import {ICallable} from '@qiwi/substrate'

export {flattie as flattenObject} from 'flattie'

export {cloneDeep as clone} from 'lodash'

export const mapValues = (input: any, fn: (input: any, key?: string) => any) => {
  const result = Array.isArray(input) ? [] : {}

  mapDescriptors(input, result, fn)

  Object.setPrototypeOf(result, Object.getPrototypeOf(input))

  return result
}

export const mapDescriptors = (input: any, target: any, fn: (input: any, key?: string) => any) => {
  const descriptors = Object.getOwnPropertyDescriptors(input)
  const isArr = Array.isArray(input)
  for (const i in descriptors) {
    const descriptor = descriptors[i]

    if (isArr && i === 'length') {
      continue
    }

    if (Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      Object.defineProperty(target, i, {
        ...descriptor,
        value: fn(descriptor.value, i),
      })
    }
  }
}

export const promisify = (fn: Function) => (...args: any[]) => Promise.resolve(fn(...args))

export const isPromiseLike = (target: any): boolean =>
  !!target && typeof target.then === 'function' && typeof target.catch === 'function'

export const isEqual = (a: any, b: any): boolean => a === b

export const generateId = () => (Math.random() + '').slice(-8) // TODO nanoid?

export const ahook = (value: any, fn: ICallable) => isPromiseLike(value)
    ? value.then(fn)
    : fn(value)

export const defineNonEnum = <T>(target: T, key: string, value: any): T => Object.defineProperty(target, key, {
  value,
  enumerable: false,
  configurable: true,
  writable: true,
})
