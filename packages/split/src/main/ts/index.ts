import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
  mapValues,
  defineNonEnum,
} from '@qiwi/masker-common'

export const appendPath = (chunk: string = '', prev: string = '') => `${prev ? prev + '.' : ''}${chunk}`

export const name: IMaskerPipeName = 'split'

export const pipe: IMaskerPipe = createPipe(
  name,
  ({value, execute, context, originPipeline}) =>
    (typeof value === 'object' && value !== null
      ? ((origin) => {
        const mapped = mapValues(origin, (v, k) => execute.execSync({...context, path: appendPath(k, context.path), pipeline: originPipeline, value: v}))
        const value = defineNonEnum(mapValues(mapped, ({value}) => value), '_split_', mapped)

        return {value}
      })(value)
      : {value}),

  async({value, execute, context, originPipeline}) =>
    (typeof value === 'object' && value !== null
      ? (async(origin) => {
        const mapped = mapValues(origin, (v, k) => execute.exec({...context, path: appendPath(k, context.path), pipeline: originPipeline, value: v}))
        const keys = Object.keys(mapped)
        const results = await Promise.all(Object.values(mapped))

        keys.forEach((key, idx) => (mapped[key] = results[idx]))

        const value = defineNonEnum(mapValues(mapped, ({value}) => value), '_split_', mapped)

        return {value}
      })(value)
      : {value}),
)

export default pipe
