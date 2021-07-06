import {execute, normalizeContext} from '@qiwi/masker-common'
import {pipe as plainPipe} from '@qiwi/masker-plain'
import {defaultOpts, name, pipe} from '../../main/ts'

describe('secret',() => {
  it('name is defined', () => {
    expect(name).toBe('secret-key')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces all values with *', () => {
      const cases = [
        ['foo bar', 'foo bar', 'public'],
        ['foo bar', '***', 'secret'],
        ['foo bar', '***', 'foo', {pattern: /foo/, pipeline: [plainPipe]}],
        ['foo bar', '***', 'foo', {pattern: 'foo', pipeline: [plainPipe]}],
        ['foo bar', '***', 'some.long.path-to.secret'],
        ['foo bar', '***', 'token'],
        ['foo bar', '***', 'credential'],
        ['foo bar', '***', 'password'],
        ['foo bar', '***', 'private'],
        [null, null],
        [12345, '***', 'token'],
        [12345, 12345, 'foobar'],
      ]
      cases.forEach(([value, expected, path, opts = defaultOpts]) => {
        const ctx = normalizeContext({value, path, opts}, execute)

        it(`${value} > ${expected}`, async() => {
          expect((await pipe.exec(ctx)).value).toEqual(expected)
          expect(pipe.execSync({...ctx, sync: (ctx.sync = true)}).value).toBe(expected)
        })
      })
    })
  })
})
