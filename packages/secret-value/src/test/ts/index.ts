import {execute, normalizeContext} from '@qiwi/masker-common'
import {pipe as plainPipe} from '@qiwi/masker-plain'
import {name, pipe} from '../../main/ts'

describe('secret',() => {
  it('name is defined', () => {
    expect(name).toBe('secret-value')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces all values with *', () => {
      const cases = [
        ['foo bar', 'foo bar', 'public'],
        ['foo bar', '***', 'secret'],
        ['foo bar', '***', 'foo', {keyPattern: /foo/}],
        ['foo bar', '***', 'foo', {keyPattern: 'foo'}],
        ['foo bar', '***', 'bar', {directives: [{keyPattern: /bar/, pipeline: [plainPipe]}]}],
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
        const input = normalizeContext({value, path, opts}, execute)

        it(`${value} > ${expected}`, async() => {
          expect(pipe.execSync({...input, sync: true, context: {...input, sync: true}}).value).toBe(expected)
          expect((await pipe.exec(input)).value).toEqual(expected)
        })
      })
    })
  })
})
