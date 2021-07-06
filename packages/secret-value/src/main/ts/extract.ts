import {asRegExp} from "@qiwi/masker-common";

export type TExtractedEntry = {
  _value: ReturnType<typeof JSON.parse>
  value: ReturnType<typeof JSON.parse>
  start: number
  end: number
}

export type TExtractor = (value: string, opts: any) => TExtractedEntry[]

export interface TExtractorOpts {
  pattern: RegExp | string
}

export const extractByRegexp: TExtractor = (value: string, {pattern}: TExtractorOpts) => {
  const entries: TExtractedEntry[] = []
  value.replace(asRegExp(pattern) as RegExp, (_value: string, ...rest: Array<string | number>) => {
    const start = +rest[rest.length - 2]

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
