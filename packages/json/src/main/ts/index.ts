import {createPipe, IMaskerPipe, IMaskerPipeInput, IMaskerPipeName, IMaskerPipeOutput} from '@qiwi/masker-common'
import {IExecutionMode} from '@qiwi/substrate-types'

import {extractJsonEntries, TJsonEntry} from './extract'

export const name: IMaskerPipeName = 'json'

const injectValue = (entry: TJsonEntry, {value}: IMaskerPipeOutput): TJsonEntry => ({...entry, value})
const injectValues = (entries: TJsonEntry[], outputs: IMaskerPipeOutput[]) => entries.map((entry, i) => injectValue(entry, outputs[i]))

export const processSync = ({value, context}: IMaskerPipeInput) => {
  const entries = extractJsonEntries(value)
  const values = entries.map((entry) => context.execute({mode: IExecutionMode.SYNC , context, value: entry.value}) as IMaskerPipeOutput)

  return populate(value, injectValues(entries, values))
}

export const processAsync = async({value, context}: IMaskerPipeInput) => {
  const entries = extractJsonEntries(value)
  const values = await Promise.all(entries.map((entry) => context.execute({...context, value: entry.value})))

  return populate(value, injectValues(entries, values))
}

export const populate = (origin: string, entries: TJsonEntry[]): string => entries.reduce((m, cur, i) => {
  if (entries.length === 0) {
    return origin
  }

  const prev = i === 0 ? {start: 0, end: 0} : entries[i - 1]
  const post = entries[i + 1] ? '' : origin.slice(cur.end)
  const pre = origin.slice(prev.end, cur.start)
  return m + pre + JSON.stringify(cur.value, null) + post
}, '')

export const pipe: IMaskerPipe = createPipe(
  name,
  ({value, context}: IMaskerPipeInput) => ({
    value: (typeof value === 'string')
      ? processSync(context)
      : value,
  }),
  async({value, context}: IMaskerPipeInput) => ({
    value: (typeof value === 'string')
      ? await processAsync(context)
      : value,
  }),
)

export default pipe
