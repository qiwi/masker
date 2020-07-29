import {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  stub,
  name,
} from '../../main/ts'

describe('strike',() => {
  it('stub equals `*`', () => {
    expect(stub).toBe('*')
  })

  it('name is defined', () => {
    expect(name).toBe('strike')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces non-space values with *', () => {
      const cases = [
        ['foo bar', '*** ***'],
        [null, '****'],
        [12345, '*****'],
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
  })
})
