import {extractJsonStrings} from '../../main/ts/extract'

describe('#extractJsonStrings', () => {
  it('finds json-like strings', () => {
    const input = ' {"foo": "bar"} and {"a":{"b":"{\\"c\\":\\"d\\"}"}} meets { "foo": "baz" } on the same string'

    expect(extractJsonStrings(input)).toEqual([
      {foo: 'bar'},
      {a: {b: '{"c":"d"}'}},
      {foo: 'baz'},
    ])
  })
})
