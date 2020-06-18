import XRegExp from 'xregexp'

export const extractJsonStrings = (input: string): ReturnType<typeof JSON.parse>[] => {
  const matches = XRegExp.matchRecursive(input, '(\\[|\\{)', '(\\}|\\])', 'g', {
    valueNames: [null, 'left', 'match', 'right'],
  })

  // wrap the matches in {}, or in [] respectively
  return matches
    .reduce<string[]>((memo, match, i) => {
      if (match.name === 'match') {
        memo.push(matches[i - 1].value + match.value + matches[i + 1].value)
      }

      return memo
    }, [])
    .map(json => {
      try {
        return JSON.parse(json)
      }
      catch {
        return
      }
    })
    .filter((v) => v !== undefined)

}
