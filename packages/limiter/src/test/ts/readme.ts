import {createMasker} from '@qiwi/masker'
import {createPipe} from '@qiwi/masker-common'
import {pipe as limiter} from '../../main/ts'

describe('limiter', () => {
  it('works as written in readme', () => {
    const echo = createPipe('echo', ({value}: any) => ({value}))
    const masker = createMasker({
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
})
