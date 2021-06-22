import {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  name,
} from '../../main/ts'

describe('json',() => {
  it('name is defined', () => {
    expect(name).toBe('json')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('extracts json from strings', () => {
      const cases = [
        [
          '   {"foo": "bar"} and {"a":{"b":"{\\"c\\":\\"d\\"}"}} meets double { "foo": "baz" } { "foo": "baz" } on the same string',
          '   {"foo": "bar"} and {"a":{"b":"{\\"c\\":\\"d\\"}"}} meets double { "foo": "baz" } { "foo": "baz" } on the same string',
        ],
        [null, null],
        [{}, {}],
      ]
      cases.forEach(([value, expected]) => {
        const result = {value: expected}
        const input = normalizeContext({value}, execute)

        fit(`${value} > ${expected}`, async() => {
          expect(pipe.execSync(input)).toEqual(result)
          expect(await pipe.exec(input)).toEqual(result)
        })
      })
    })
  })
})
