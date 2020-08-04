import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
  mapValues,
} from '@qiwi/masker-common'

export const name: IMaskerPipeName = 'split'

export const pipe: IMaskerPipe = createPipe(name, ({value, execute, context, originPipeline}) =>
  (typeof value === 'object'
    ? ((origin) => {
      const mapped = mapValues(origin, (v) => execute.sync({...context, pipeline: originPipeline, value: v}))
      const value = mapValues(mapped, ({value}) => value)
      const properties = mapValues(mapped, ({schema}) => schema)
      const schema = {
        type: 'object',
        properties,
      }

      return {value, schema}
    })(value)
    : {value}))

export default pipe
