import {execute, normalizeContext} from '@qiwi/masker-common'
import {pipe as plainPipe} from '@qiwi/masker-plain'
import {name, pipe} from '../../main/ts'

describe('secret-value',() => {
  it('name is defined', () => {
    expect(name).toBe('secret-value')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces all values with *', () => {
      const cases = [
        ['foo bar baz baaar qux', 'foo *** baz *** qux', /ba+r/g],
        ['some string with pwd=foobar and pwd=qux', 'some string with *** and ***', /pwd=(\s*\S+)/gi],
      ]
      cases.forEach(([value, expected, pattern]) => {
        const ctx = normalizeContext({value, opts: {
          pipeline: [plainPipe],
          pattern,
        }}, execute)

        it(`${value} > ${expected}`, async() => {
          expect((await pipe.exec(ctx)).value).toEqual(expected)
          expect(pipe.execSync({...ctx, sync: (ctx.sync = true)}).value).toBe(expected)
        })
      })
    })
  })
})
