import {
  createPipe,
  defineNonEnum,
  unboxValue,
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeOutput,
  IEnrichedContext,
  IMaskerPipeInput,
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
  ({value, context}: IMaskerPipeInput) =>
    (typeof value === 'object' && value !== null
      ? ((origin) => {
        const values = Object.values(origin).map(process(context)) as IMaskerPipeOutput[]
        const keys = Object.keys(origin).map(process(context, true)) as IMaskerPipeOutput[]

        return assemble(values, keys, origin)

      })(value)
      : {value}),

  async({value, context}: IMaskerPipeInput) =>
    (typeof value === 'object' && value !== null
      ? (async(origin) => {

        const values = Promise.all(Object.values(origin).map(process(context)))
        const keys = Promise.all(Object.keys(origin).map(process(context, true)))

        return assemble(await values, await keys, origin)

      })(value)
      : {value}),
)

export default pipe
