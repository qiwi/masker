import {
  hook,
  IEnrichedContext,
  IMaskerPipeDual,
  IMaskerPipeInput,
  IMaskerPipeOutput,
  SyncGuard,
} from '@qiwi/masker-common'
import {TExtractedEntry, TExtractor} from './extract'

export const injectValue = (entry: TExtractedEntry, {value}: IMaskerPipeOutput): TExtractedEntry => ({...entry, value})
export const injectValues = (entries: TExtractedEntry[], outputs: IMaskerPipeOutput[]): IMaskerPipeOutput[] =>
  entries.map((entry, i) => injectValue(entry, outputs[i]))

export const process = <C extends IMaskerPipeInput>(entries: TExtractedEntry[], {context, execute, sync, originPipeline, opts}: C): SyncGuard<IMaskerPipeOutput[], C> => {
  const outputs = entries.map(({value}) => execute({...context, value, pipeline: opts.pipeline || originPipeline, path: undefined}))
  return hook(sync
    ? outputs
    : Promise.all(outputs), (_outputs: IMaskerPipeOutput[]) => injectValues(entries, _outputs)) as SyncGuard<TExtractedEntry[], C>
}

export const populate = (origin: string, entries: TExtractedEntry[]): string =>
  entries.length === 0 ? origin : entries.reduce((m, cur, i) => {
    const prev = i === 0 ? {start: 0, end: 0} : entries[i - 1]
    const post = entries[i + 1] ? '' : origin.slice(cur.end)
    const pre = origin.slice(prev.end, cur.start)
    const value = cur.value instanceof Object ? JSON.stringify(cur.value, null) : cur.value
    return m + pre + value + post
  }, '')

export const createExec = (extract: TExtractor): IMaskerPipeDual =>
  <C extends IEnrichedContext>({value, context, opts}: C): SyncGuard<IMaskerPipeOutput, C> =>
    hook(process(extract(value, opts), context), (entries: TExtractedEntry[]) => ({value: populate(value, entries)}))
