import {extractJsonEntries} from '../../main/ts/extract'

describe('#extractJsonStrings', () => {
  it('finds json-like strings', () => {
    const input = ' {"foo":"bar"} and {"a":{"b":"{\\"c\\":\\"d\\"}"}} meets {"foo":"baz"} on the same string'

    expect(extractJsonEntries(input)).toEqual([
      {
        _value: '{"foo":"bar"}',
        value: {foo: 'bar'},
        end: 14,
        start: 1,
      },
      {
        _value: '{"a":{"b":"{\\"c\\":\\"d\\"}"}}',
        value: {a: {b: '{"c":"d"}'}},
        end: 46,
        start: 19,
      },
      {
        _value: '{"foo":"baz"}',
        value: {foo: 'baz'},
        end: 66,
        start: 53,
      },
    ])
  })
})
