import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
  mapValues,
  defineNonEnum,
} from '@qiwi/masker-common'

export const appendPath = (chunk: string = '', prev: string = '') => `${prev ? prev + '.' : ''}${chunk}`

export const randomizeKeys = (keys: string[]) => {
  const counters: Record<string, number> = {}
  const getCount = (k: string): number => (counters[k] = (counters[k] || 0) + 1)

  return keys.map((k) => {
    const count = getCount(k)

    return count === 1
      ? k
      : `${k}(${count})`
  })
}

// const boxValue = (value: any) => ({value})

const unboxValue = ({value}: any) => value

export const assemble = (values: any[], keys: string[], mapped: any) => {
  const target: Record<string, any> = Array.isArray(mapped) ? [] : {}
  const value = randomizeKeys(keys).reduce((m, k, i) => {
    m[k] = values[i]
    return m
  }, target)

  return defineNonEnum(value, '_split_', mapped)
}
const echo = <T>(v: T): T => v

export const name: IMaskerPipeName = 'split'

export const pipe: IMaskerPipe = createPipe(
  name,
  ({value, execute, context, originPipeline}) =>
    (typeof value === 'object' && value !== null
      ? ((origin) => {
        const mapped = mapValues(origin, (v, k) => execute.execSync({...context, path: appendPath(k, context.path), pipeline: originPipeline, value: v}))
        const keys = Object.keys(mapped).map(Array.isArray(mapped) ? echo : (k) => execute.execSync({...context, pipeline: originPipeline, path: undefined, value: k}).value)
        const values = Object.values(mapped).map(unboxValue)
        const value = assemble(values, keys, mapped)

        return {value}
      })(value)
      : {value}),

  async({value, execute, context, originPipeline}) =>
    (typeof value === 'object' && value !== null
      ? (async(origin) => {
        const mapped = mapValues(origin, (v, k) => execute.exec({...context, path: appendPath(k, context.path), pipeline: originPipeline, value: v}))
        const keys = Array.isArray(mapped)
          ? Object.keys(mapped)
          : (await Promise.all(Object.keys(mapped).map((k) => execute.exec({...context, pipeline: originPipeline, path: undefined, value: k})))).map(unboxValue)
        const boxedValues = await Promise.all(Object.values(mapped))
        const values = boxedValues.map(unboxValue)

        keys.forEach((key, idx) => (mapped[key] = boxedValues[idx]))

        const value = assemble(values, keys, mapped)

        return {value}
      })(value)
      : {value}),
)

export default pipe
