# @qiwi/masker-limiter
The plugin to limit masking steps and duration

## Install
```shell script
yarn add @qiwi/masker-limiter
```

## Usage
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

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
