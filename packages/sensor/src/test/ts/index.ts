import {normalizeContext, execute} from '@qiwi/masker-common'
import {pipe as plainPipe} from '@qiwi/masker-plain'
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
        ['foo bar', 'foo bar', 'public'],
        ['foo bar', '***', 'secret'],
        ['foo bar', '***', 'foo', {pattern: /foo/}],
        ['foo bar', '***', 'foo', {pattern: 'foo'}],
        ['foo bar', '***', 'bar', {directives: [{pattern: /bar/, pipeline: [plainPipe]}]}],
        ['foo bar', '***', 'some.long.path-to.secret'],
        ['foo bar', '***', 'token'],
        ['foo bar', '***', 'credential'],
        ['foo bar', '***', 'password'],
        ['foo bar', '***', 'private'],
        [null, null],
        [12345, '***', 'token'],
        [12345, 12345, 'foobar'],
      ]
      cases.forEach(([value, expected, path, opts = {}]) => {
        const result = expected
        const input = normalizeContext({value, path, opts}, execute)

        it(`${value} > ${expected}`, async() => {
          expect(pipe.execSync({...input, sync: true}).value).toBe(result)
          expect((await pipe.exec(input)).value).toEqual(result)
        })
      })
    })
  })
})
