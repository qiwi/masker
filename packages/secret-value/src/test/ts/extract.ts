import {extractByRegexp} from '../../main/ts/extract'

describe('extract', () => {
  it('returns string chunks', () => {
    expect(extractByRegexp('foo bar baz baaar qux', {pattern: /ba+r/g})).toEqual([
      {
        _value: 'bar',
        value: 'bar',
        start: 4,
        end: 7,
      },
      {
        _value: 'baaar',
        value: 'baaar',
        start: 12,
        end: 17,
      },
    ])
  })
})
