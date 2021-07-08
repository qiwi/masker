# @qiwi/masker
Composite data masking utility.

## Key features
* Composite and configurable
* Sync and async API
* TS and Flow typings

## Install
```shell
yarn add @qiwi/masker
```

## Usage
### masker
Default masker is applicable for the most cases: for strings, objects, json strings, which may contain any standard secret [keys](https://github.com/qiwi/masker/tree/master/packages/secret-key), [values](https://github.com/qiwi/masker/tree/master/packages/secret-value) or [PANs](https://github.com/qiwi/masker/tree/master/packages/pan).
```ts
import {masker} from '@qiwi/masker'

masker('411111111111111')       // Promise<4111 **** **** 1111>
masker.sync('4111111111111111') // 4111 **** **** 1111

masker.sync({
  token: 'foo bar',
  password: 'bazqux',
  details: {
    pans: ['4111111111111111', '1234123412341234'],
    some: 'value'
  }
})

/*
{
  token: '***',
  password: '***',
  details: {
    pans: ['4111 **** **** 1111', '1234123412341234'],
    some: 'value'
  }
}
*/
```

### createMasker
The masker factory builds a new masker instance with custom options (pipeline, registry, etc):
```ts
import {createMasker, registry} from '@qiwi/masker'

const masker = createMasker({
  registry,
  pipeline: ['split', 'strike']
})

masker.sync({
  foo: {
    bar: {
      baz: 'baaaaz'
    },
    qux: null,
    quux: 'qu ux'
  }
})
/*
{
  foo: {
    bar: {
      baz: '******'
    },
    qux: null,
    quux: '** **'
  }
}
*/
```

### registry
`registry` provides plugin-by-name resolution for pipelines. This mechanics is strictly required by the [schema](https://github.com/qiwi/masker/tree/master/packages/schema) processor.
```ts
import {masker} from '@qiwi/masker'
import pan from '@qiwi/masker-pan'

masker('data', {pipeline: [pan]})
```
```ts
import {registry} from '@qiwi/masker'
import pan from '@qiwi/masker-pan'

registry.add(pan)

masker('data', {pipeline: ['pan'], registry})
```