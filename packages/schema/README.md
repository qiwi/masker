# @qiwi/masker-schema
Masker scheme builder and executor

## Features
* Builds object's `schema` on masking 
* Applies `schema` to object as a directive

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
    token: {type: 'string', valueDirectives: ['plain', 'secret-key']},
    password: {type: 'string', valueDirectives: ['plain', 'secret-key']},
    details: {
      type: 'object',
      properties: {
        pans: {
          type: 'object',
          properties: {0: {type: 'string', valueDirectives: ['pan']}, 1: {type: 'string'}},
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

The properties, which have no `valueDirectives` or `keyDirectives`, will be not processed at all. 
Masker wouldn't even try to observe its inners. This feature makes a lot of sense if you deal with huge same-structured objects.
```ts
const obj = {
  foo: 'foo foo',
  bar: 'bar',
  baz: 'baz',
}
const masker = createMasker({
  pipeline: [schema, ...pipeline],
})
const masked = masker.sync(obj, {
  schema: {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        valueDirectives: ['strike'],
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
MIT
