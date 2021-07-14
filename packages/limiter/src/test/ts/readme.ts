import {createMasker, createPipe, registry} from '@qiwi/masker'
import {pipe as limiter} from '../../main/ts'

describe('limiter', () => {
  describe('works as written in readme', () => {
    it('example #1', () => {
      const echo = createPipe('echo', ({value}: any) => ({value}))
      const masker = createMasker({
        registry,
        pipeline: [[limiter, {limit: 7}], echo, 'split'],
      })
      const obj = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      }

      // [echo, split] for the root `obj` - 2
      // [echo, split] for `obj.foo` value — 4
      // [echo, split] for `obj.bar` value — 6
      // [echo, split] for `obj.bar` value — 8 > 7
      // the last `split` was replaced with fallback pipes [plain]
      // so `baz` value has become `***`
      // and all the keys were converted with [plain] too:

      expect(masker.sync(obj)).toEqual({
        '***': 'foo',
        '***(2)': 'bar',
        '***(3)': '***',
      })
    })

    it('example #2', async() => {
      let delay = 0
      const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
      const echoPipe = createPipe(
        'echo',
        ({value}: any) => ({value}),
        async({value}: any) => {
          await sleep(delay += 50)
          return {value}
        },
      )
      const masker = createMasker({
        registry,
        pipeline: [[limiter, {duration: 200}], echoPipe, 'split'],
      })
      const obj = ['foo', 'bar', 'baz']
      expect(await masker(obj)).toEqual(['foo', '***', '***'])
    })
  })
})
