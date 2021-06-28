import {normalizeContext, execute, createPipe as cp, IMaskerPipeInput} from '@qiwi/masker-common'
import {pipe as split} from '@qiwi/masker-split'
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
          '   {"foo":"bar"} and {"a":{"b":"{\\"c\\":\\"d\\"}"}} meets double {"foo":"baz"} {"foo":"baz"} on the same string',
        ],
        [null, null],
        [{}, {}],
      ]
      cases.forEach(([value, expected]) => {
        const result = {value: expected}
        const input = normalizeContext({value}, execute)

        it(`${value} > ${expected}`, async() => {
          expect(pipe.execSync(input)).toEqual(result)
          expect(await pipe.exec(input)).toEqual(result)
        })
      })
    })

    it('applied pipeline to found json entries', () => {
      const dcap = cp('dcap', ({value}: IMaskerPipeInput) => value === 'd' ? {value: 'D'} : {value})
      const pipeline = [dcap, split, pipe]

      const value = '   {"a":{"b":"{\\"c\\":\\"d\\"}"}} {"e": "d"}   '
      const expected = '   {"a":{"b":"{\\"c\\":\\"D\\"}"}} {"e":"D"}   '
      const result = execute.sync({pipeline, value})

      expect(result).toMatchObject({value: expected})
    })
  })
})
