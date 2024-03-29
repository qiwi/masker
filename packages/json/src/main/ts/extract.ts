import XRegExp from 'xregexp'

import {TExtractedEntry} from '@qiwi/masker-secret-value'

export const extractJsonEntries = (input: string): TExtractedEntry[] => {
  const matches = XRegExp.matchRecursive(input, '(\\[|\\{)', '(\\}|\\])', 'g', {
    valueNames: [null, 'left', 'match', 'right'],
  })

  // wrap the matches in {}, or in [] respectively
  return matches
    .reduce<TExtractedEntry[]>((memo, match, i) => {
      if (match.name === 'match') {
        const value = matches[i - 1].value + match.value + matches[i + 1].value
        const entry = {
          _value: value,
          value,
          start: matches[i - 1].start,
          end: matches[i + 1].end,
        }
        memo.push(entry)
      }

      return memo
    }, [])
    .map((entry) => {
      try {
        if (!checkJson(entry.value)) {
          return
        }
        entry.value = JSON.parse(entry.value)
        return entry
      }
      catch {
        return
      }
    })
    .filter((v) => v !== undefined) as TExtractedEntry[]
}

// https://stackoverflow.com/a/3710506
export const checkJson = (str: string): boolean => /^[\s,:\]{}]*$/.test(str.replace(/\\["/\\bfnrtu]/g, '@').
replace(/"[^\n\r"\\]*"|true|false|null|-?\d+(?:\.\d*)?(?:[Ee][+-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
