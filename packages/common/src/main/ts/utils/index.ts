// import {get} from 'lodash'

import {ICallable} from '@qiwi/substrate'
import {deepMap} from './deepmap'

export {deepMap, mapValues} from './deepmap'

export const promisify = (fn: Function) => (...args: any[]) => Promise.resolve(fn(...args))

export const isPromiseLike = (target: any): boolean =>
  !!target && typeof target.then === 'function' && typeof target.catch === 'function'

export const isEqual = (a: any, b: any): boolean => a === b

export const generateId = () => (Math.random() + '').slice(-8)

// https://stackoverflow.com/questions/44134212/best-way-to-flatten-js-object-keys-and-values-to-a-single-depth-array
export const flattenObject = (src: Record<string, any>, prefix?: string): Record<string, any> => {
  const target: Record<string, any> = {}
  const _prefix = prefix ? prefix + '.' : ''

  for (let i in src) {
    if (!src.hasOwnProperty(i)) continue

    if (typeof src[i] === 'object' && src[i] !== null) {
      // Recursion on deeper objects
      Object.assign(target, flattenObject(src[i] as Record<string, any>, _prefix + i))
    }
    else {
      target[_prefix + i] = src[i]
    }
  }

  return target
}

export const unflattenObject = (src: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (let i in src) {
    if (src.hasOwnProperty(i)) {
      // Just a complicated regex to only match a single dot in the middle of the string
      const keys = i.split(/(?<!\.|^)\.(?!\.+|$)/)

      keys.reduce((r, e, j) => {
        return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 === j ? src[i] : {}) : [])
      }, result)
    }
  }
  return result
}

export const clone = (src: any): any => deepMap(src, (v) => v)

export const ahook = (value: any, fn: ICallable) => isPromiseLike(value)
    ? value.then(fn)
    : fn(value)

/*export const substitute = (src: any, path: string): any => {
  const chunks: string[] = path.split('.')
  const target = getSubstituteBlank(src)

  chunks.forEach((chunk) => {
    const subs = getSubstituteBlank(get(src, chunk))
  })
}*/

/*export const getSubstituteBlank = (src: any) =>
    typeof src === 'object' && src !== null
      ? Array.isArray(src)
        ? []
        : {}
    : src*/
