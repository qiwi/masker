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

export const asynchronize = <F extends ICallable>(fn: F) => (...args: any[]): Promise<ReturnType<F>> => new Promise((resolve, reject) => {
  try {
    resolve(fn(...args))
  }
  catch (e) {
    reject(e)
  }
})

export const isPromiseLike = (target: any): boolean =>
  !!target && typeof target.then === 'function' && typeof target.catch === 'function'

export const isEqual = (a: any, b: any): boolean => a === b

export const generateId = () => (Math.random() + '').slice(-8) // TODO nanoid?

export const hook = (value: any, fn: ICallable) => isPromiseLike(value)
    ? value.then(fn)
    : fn(value)

export const defineNonEnum = <T>(target: T, key: string, value: any): T => Object.defineProperty(target, key, {
  value,
  enumerable: false,
  configurable: true,
  writable: true,
})

// const boxValue = (value: any) => ({value})
// const echo = <T>(v: T): T => v
