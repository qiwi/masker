import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
  defineNonEnum, IMaskerPipeOutput, IEnrichedContext,
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
// const echo = <T>(v: T): T => v

const unboxValue = ({value}: any) => value

export const assemble = (values: IMaskerPipeOutput[], keys: IMaskerPipeOutput[], origin: any) => {
  const mapped = {keys, values, origin}
  const target: Record<string, any> = Array.isArray(origin) ? [] : {}
  const _values = values.map(unboxValue)
  const _keys = keys.map(unboxValue)
  const result = randomizeKeys(_keys).reduce((m, k, i) => {
    m[k] = _values[i]
    return m
  }, target)

  return {value: defineNonEnum(result, '_split_', mapped)}
}

export const name: IMaskerPipeName = 'split'

export const process = ({context, originPipeline, execute, value}: IEnrichedContext, skipPath?: boolean, keys: string[] = Object.keys(value)) => <K>(k: K, i: number) => skipPath && Array.isArray(value)
  ? ({value: k} as IMaskerPipeOutput)
  : execute({...context, pipeline: originPipeline, path: skipPath ? undefined : appendPath(keys[i], context.path), value: k})

export const pipe: IMaskerPipe = createPipe(
  name,
  ({value, context}) =>
    (typeof value === 'object' && value !== null
      ? ((origin) => {
        const values = Object.values(origin).map(process(context)) as IMaskerPipeOutput[]
        const keys = Object.keys(origin).map(process(context, true)) as IMaskerPipeOutput[]

        return assemble(values, keys, origin)

      })(value)
      : {value}),

  async({value, context}) =>
    (typeof value === 'object' && value !== null
      ? (async(origin) => {

        const values = await Promise.all(Object.values(origin).map(process(context)))
        const keys = await Promise.all(Object.keys(origin).map(process(context, true)))

        return assemble(values, keys, origin)

      })(value)
      : {value}),
)

export default pipe
