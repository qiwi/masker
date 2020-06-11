export const promisify = (fn: Function) => (...args: any[]) => Promise.resolve(fn(...args))

export {deepMap} from './deepmap'

export const isPromiseLike = (target: any): boolean =>
  !!target && typeof target.then === 'function' && typeof target.catch === 'function'
