# @qiwi/masker-limiter
The plugin to limit masking steps and duration

## Install
```shell script
yarn add @qiwi/masker-limiter
```

## Usage
To limit the execution steps:
```typescript
import {createMasker, pipeline, createPipe} from '@qiwi/masker-common'
import {pipe as limiter} from '@qiwi/masker-limiter'

const echo = createPipe('echo', (v) => ({v}))
const masker = createMasker({
  pipeline: [[limiter, {limit: 7, pipeline: ['plain']}], 'split', echo]
})
const obj = {
  foo: 'foo',
  bar: 'bar',
  baz: 'baz',
}

masker.sync(obj)

// [echo, split] was invoked for `obj` - 2
// [echo, split] for `obj.foo` value — 4
// [echo, split] for `obj.bar` value — 6
// [echo, split] for `obj.bar` value — 8 > 7
// so the last `split` was replaced with fallback pipes [plain],
// therefore `baz` value has become `***`
// and all the rest keys were converted with [plain] pipeline too:
{
  '***': 'foo',
  '***(2)': 'bar',
  '***(3)': '***',
}
```
To limit the exec duration:
```ts
import {createMasker, pipeline, createPipe} from '@qiwi/masker-common'
import {pipe as limiter} from '@qiwi/masker-limiter'

let delay = 0
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
const echoPipe = createPipe(
  'echo',
  ({value}: any) => ({value}),
  async({value}: any) => {
    // NOTE split executes queues in parallel, so we use progressive delay
    await sleep(delay += 25)
    return {value}
  },
)
const masker = createMasker({
  pipeline: [[limiter, {duration: 100}], echoPipe, 'split'],
})
const obj = ['foo', 'bar', 'baz']

await masker(obj)

// result:
['foo', '***', '***']
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
