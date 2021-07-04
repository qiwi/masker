import {asArray, asRegExp} from '../../main/ts'

describe('utils', () => {
  describe('asArray', () => {
    it('wraps non-array to array', () => {
      expect(asArray({})).toEqual([{}])
      expect(asArray(undefined)).toEqual([undefined])
    })
    it('returns array as is', () => {
      expect(asArray([{}])).toEqual([{}])
      expect(asArray(['foo'])).toEqual(['foo'])
    })
  })

  describe('asRegExp', () => {
    it('converts strings to regexes', () => {
      expect(asRegExp('foo')).toEqual(/foo/gi)
    })
    it('returns regexps as is', () => {
      expect(asRegExp(/foo/)).toEqual(/foo/)
      expect(asRegExp(new RegExp('foo', 'i'))).toEqual(/foo/i)
    })
    it('returns undefined otherwise', () => {
      expect(asRegExp(null)).toBeUndefined()
      expect(asRegExp(undefined)).toBeUndefined()
      expect(asRegExp({})).toBeUndefined()
      expect(asRegExp(1)).toBeUndefined()
    })
  })
})
