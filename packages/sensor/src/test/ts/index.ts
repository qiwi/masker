import {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  name,
} from '../../main/ts'

describe('sensor',() => {
  it('name is defined', () => {
    expect(name).toBe('sensor')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces all values with *', () => {
      const cases = [
        ['foo bar', '***', 'token'],
        ['foo bar', '***', 'some.long.path-to.sensor'],
        ['foo bar', '***', 'credential'],
        ['foo bar', '***', 'password'],
        ['foo bar', '***', 'private'],
        [null, null],
        [12345, '***', 'token'],
        [12345, 12345, 'foobar'],
      ]
      cases.forEach(([value, expected, path]) => {
        const result = expected
        const input = normalizeContext({value, path}, execute)

        it(`${value} > ${expected}`, async() => {
          expect(pipe.execSync(input).value).toBe(result)
          expect((await pipe.exec(input)).value).toEqual(result)
        })
      })
    })
  })
})
