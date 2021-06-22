import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  createPipe,
} from '@qiwi/masker-common'

import {extractJsonEntries} from './extract'

export const name: IMaskerPipeName = 'json'

export const process = ({value, context}: IMaskerPipeInput) => {
  const entries = extractJsonEntries(value)

  if (entries.length === 0) {
    return value
  }
// @ts-ignore
  console.log(!context)
  const values = entries //.map(({value}) => context.execute({...context, value}).value)

  return values.reduce((m, cur, i) => {
    const prev = i === 0 ? {start: 0, end: 0} : values[i - 1]
    const post = values[i + 1] ? '' : value.slice(cur.end)
    const pre = value.slice(prev.end, cur.start)
    return m + pre + cur.value + post
  }, '')
}

export const pipe: IMaskerPipe = createPipe(name, ({value, context}: IMaskerPipeInput) => ({
  value: (typeof value === 'string')
    ? process(context)
    : value,
}))

export default pipe
