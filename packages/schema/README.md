# @qiwi/masker-schema
Masker scheme builder and executor

## Features
* Builds object `schema` on masking 
* Applies masker `schema` to object as a directive

Masker schema is a superset of a regular json-schema. 
It introduces `maskValue` and `maskKey` directives to declare pipelines for object parts.
```ts
export interface IMaskerSchema {
  type?: any
  maskValue?: Array<IMaskerDirective>
  maskKey?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema>
  items?: Record<string, IMaskerSchema> | Array<IMaskerSchema>
}
```

## Install
```shell script
yarn add @qiwi/masker-schema
```

## Usage
```typescript
import {pipeline, createMasker} from '@qiwi/masker'
import {pipe as schema} from '@qiwi/masker-schema'

const masker = createMasker({
  pipeline: [schema, ...pipeline]
})

const obj = {
  token: 'foo bar',
  password: 'bazqux',
  details: {
    pans: ['4111111111111111', '1234123412341234'],
    some: 'value'
  }
}
const res = masker.sync(obj, {unbox: false})

// res.value
{
  token: '***',
  password: '***',
  details: {
    pans: ['4111 **** **** 1111', '1234123412341234'],
    some: 'value',
  },
}

// res.schema
{
  type: 'object',
  properties: {
    token: {type: 'string', maskValue: ['plain', 'secret-key']},
    password: {type: 'string', maskValue: ['plain', 'secret-key']},
    details: {
      type: 'object',
      properties: {
        pans: {
          type: 'object',
          properties: {0: {type: 'string', maskValue: ['pan']}, 1: {type: 'string'}},
        }, some: {type: 'string'},
      },
    },
  },
}
```

Now `res.schema` may be applied to similar objects/instances.
```ts
const _res = masker.sync(obj, {unbox: false, schema: res.schema})
```

The entries, which have no `maskValue` or `maskKey`, will be not processed at all. 
Masker wouldn't even try to observe its inners. This feature makes a lot of sense if you deal with huge same-structured objects.
```ts
import {pipeline, createMasker, registry} from '@qiwi/masker'
import {pipe as schema} from '@qiwi/masker-schema'

const obj = {
  foo: 'foo foo',
  bar: 'bar',
  baz: 'baz',
}
const masker = createMasker({
  registry,
  pipeline: [schema, ...pipeline],
})
const masked = masker.sync(obj, {
  schema: {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        maskValue: ['strike'],
      },
    },
  },
})

// masked:
{
  foo: '*** ***',
  bar: 'bar',
  baz: 'baz',
}
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
