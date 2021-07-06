import {
  hook,
  IEnrichedContext,
  IMaskerPipeDual,
  IMaskerPipeInput,
  IMaskerPipeOutput,
  SyncGuard,
} from '@qiwi/masker-common'

export type TChunk = {
  _value: ReturnType<typeof JSON.parse>
  value: ReturnType<typeof JSON.parse>
  start: number
  end: number
}

export type TExtractor = (value: string, opts: any) => TChunk[]

export const extract: TExtractor = (value: string, pattern) => {
  const entries: TChunk[] = []
  value.replace(pattern, (_value: string, start: number) => {
    entries.push({
      _value,
      value: _value,
      start,
      end: start + _value.length,
    })

    return _value
  })

  return entries
}

export const process = <C extends IMaskerPipeInput>(entries: TChunk[], {context, execute, sync, originPipeline}: C): SyncGuard<TChunk[], C> => {
  const result = entries.map(({value}) => execute({...context, value, pipeline: originPipeline, path: undefined}))
  return (sync
    ? result
    : Promise.all(result)) as SyncGuard<TChunk[], C>
}

export const populate = (origin: string, entries: TChunk[]): string => entries.length === 0 ? origin : entries.reduce((m, cur, i) => {
  const prev = i === 0 ? {start: 0, end: 0} : entries[i - 1]
  const post = entries[i + 1] ? '' : origin.slice(cur.end)
  const pre = origin.slice(prev.end, cur.start)
  return m + pre + JSON.stringify(cur.value, null) + post
}, '')

export const createExec = (extract: TExtractor): IMaskerPipeDual =>
  <C extends IEnrichedContext>({value, context}: C): SyncGuard<IMaskerPipeOutput, C> =>
    hook(process(extract(value, /foo/g), context), (entries: TChunk[]) => ({value: populate(value, entries)}))
