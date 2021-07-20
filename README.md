# @qiwi/masker
[![Build status](https://ci.appveyor.com/api/projects/status/36cy67t5tldbckce/branch/master?svg=true)](https://ci.appveyor.com/project/QIWI/masker/branch/master) [![Maintainability](https://api.codeclimate.com/v1/badges/6205424ac673cb3f2bb8/maintainability)](https://codeclimate.com/github/qiwi/masker/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/6205424ac673cb3f2bb8/test_coverage)](https://codeclimate.com/github/qiwi/masker/test_coverage)  
Composite data masking utility

## Table of Contents
- [Digest](#digest)
    - [Purpose](#purpose)
    - [Status](#status)
    - [Roadmap](#roadmap)
    - [Key features](#key-features)
- [Getting started](#getting-started)
    - [Install](#install)
    - [Default preset](#default-preset)
    - [Custom pipeline](#custom-pipeline)
    - [Masking schema](#masking-schema)
    - [CLI](#cli)
- [Integration](#integration)
    - [Console](#console)
    - [Winston](#winston)
- [Design](#design)
    - [Middleware](#middleware)
    - [Context](#context)
    - [Sync / async](#sync-/-async)
- [Documentation](#documentation)
- [Packages](#packages)
- [License](#license)

## Digest
### Purpose
Implement instruments, describe practices, contracts to solve sensitive data masking problem in JS/TS.
For secure logging, for public data output, for internal mimt-proxies (kuber sensitive-data-policy) and so on.

### Status
🚧 Work in progress / MVP#0 is available for testing  
⚠️ **Not ready for production yet**

### Roadmap
- [x] Implement masking composer/processor
- [x] Introduce (declarative?) masking directives: [schema](https://github.com/qiwi/masker/tree/master/packages/schema)
- [x] Describe masking strategies and add masking utils
- [x] Support logging tools integration

### Key features
* Both sync and async API
* Declarative configuration
* Deep customization
* TS and Flow typings

## Getting started
### Install
With npm:
```shell
npm install --save @qiwi/masker
```
or yarn:
```shell
yarn add @qiwi/masker
```

### Default preset
```ts
import {masker} from '@qiwi/masker'

// Suitable for most std cases: strings, objects, json strings, which may contain any standard secret keys/values or card PANs.
masker('411111111111111')       // Promise<4111 **** **** 1111>
masker.sync('4111111111111111') // 4111 **** **** 1111
```

### Custom pipeline
```ts
import {masker, registry} from '@qiwi/masker'

masker.sync({
  secret: 'foo',
  nested: {
    pans: [4111111111111111]
  },
  foo: 'str with printed password=foo and smth else',
  json: 'str with json inside {"secret":"bar"} {"4111111111111111":"bar"}',
}, {
  registry,           // plugin storage
  pipeline: [
    'split',          // to recursively process object's children. The origin `pipeline` will be applied to internal keys and values
    'pan',            // to mask card PANs
    'secret-key',     // to conceal sensitive fields like `secret` or `token` (pattern is configurable)
    'secret-value',   // to replace sensitive parts of strings like `token=foobar` (pattern is configurable)
    'json',           // to find jsons in strings
  ]
})

// result:
{
  secret: '***',      // secret-key
  nested: { // split
    pans: [ // split
      '4111 **** **** 1111' // pan
    ],  
  },
  foo: 'str with printed *** and smth else',  // secret-value
  // json
  // chunk#1: split, secret-key
  // chunk#2: split, pan (applied to key!)
  json: 'str with json inside {"secret":"***"} {"4111 **** **** 1111":"bar"}'
}
```

### Masking schema
Declare masker directives over [json-schema](https://json-schema.org/). See [@qiwi/masker-schema](https://github.com/qiwi/masker/tree/master/packages/schema) for details.
```ts
import {masker} from '@qiwi/masker';

masker.sync({
  fo: 'fo',
  foo: 'bar',
  foofoo: 'barbar',
  baz: 'qux',
  arr:  [4111111111111111, 1234123412341234]
}, {
  pipeline: ['schema'],
  schema: {
    type: 'object',
    properties: {
      fo: {
        type: 'string',
        maskKey: ['plain']
      },
      foo: {
        type: 'string',
        maskKey: ['plain']
      },
      foofoo: {
        type: 'string',
        maskKey: ['strike'],
        maskValue: ['plain']
      },
      arr: {
        type: 'array',
        items: {
          type: 'number',
          maskValue: ['pan']
        }
      }
    }
  }
})

// result:
{
  baz: 'qux',
  arr: [ '4111 **** **** 1111', '1234123412341234' ],
  '***': 'fo',
  '***(2)': 'bar',
  '******': '***',
}
```

### CLI
```shell script
npx masquer "4111 1111 1111 1111"
# returns 4111 **** **** 1111
```

## Integration
### Console
Override global console methods to print sensitive data free output to `stderr/stdout`:
```ts
import {masker} from '@qiwi/masker'

['log', 'info', 'error'].forEach(method => {
  const _method = console[method]
  console[method] = (...args: any[]) => _method(...args.map(masker))
})
```

### Winston
Create a [custom masker formatter](https://github.com/winstonjs/winston#formats), then attach it to your reporter / transport:
```ts
const winston = require('winston')
const {masker} = require('@qiwi/masker')

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => Object.assign(info, masker.sync(info)))(),
        winston.format.json(),
      ),
    })
  ]
})

logger.log({
  level: 'info',
  message: {foo: 'bar', secret: 'foobar', pan: [4111111111111111, 1234123412341234]},
})

// stdout
{"level":"info","message":{"foo":"bar","secret":"***","pan":["4111 **** **** 1111","1234123412341234"]}}
```
[stackoverflow.com/how-to-make-a-custom-json-formatter-for-winston3-logger](https://stackoverflow.com/questions/51454523/how-to-make-a-custom-json-formatter-for-winston3-logger)

## Design
### Middleware
The masker bases on the middleware pattern: it takes some data and pushes it forward the `pipeline`. 
The output of each `pipe` is the input for the next one. Each pipe is a dual interface data processor:
```ts
export interface IMaskerPipe {
  name: IMaskerPipeName
  exec: IMaskerPipeAsync | IMaskerPipeDual
  execSync: IMaskerPipeSync | IMaskerPipeDual,
  opts?: IMaskerPipeOpts
}
```
During the execution, every pipe handler takes full control of the `context`. It can override next steps, change the `executor` impl (replace, append hook, etc), 
create internal masker threads, parallelize invocation queues and sync them back together, and so on.

### Context
During the processing, each pipe is fed with normalized context which consists of:
```ts
export interface IMaskerPipeInput {
  value: any                // value to process
  _value?: any              // pipe result
  id: IContextId            // ctx unique key
  context: IMaskerPipeInput // ctx self ref
  parentId?: IContextId     // parent ctx id
  registry: IMaskerRegistry       // pipe registry attached to ctx
  execute: IExecutor              // executor 
  sync: boolean                   // sync / async switch
  mode: IExecutionMode            // lagacy sync switch
  opts: IMaskerOpts               // current pipe options
  pipe?: IMaskerPipeNormalized              // current pipe ref
  pipeline: IMaskerPipelineNormalized       // actual pipeline
  originPipeline: IMaskerPipelineNormalized // origin pipeline
  [key: string]: any
}
```

### Sync / async
Both. In different situations, each api has disadvantages and advantages.
For this reason, the masker provides a choice:
```ts
masker(data)                // async
masker.sync(data)           // sync
masker(data, {sync: true})  // sync
```

### Documentation
* [JS/TS API](https://github.com/qiwi/masker/blob/master/API.md)
* [CLI](https://github.com/qiwi/masker/blob/master/CLI.md)

## Packages
There is also a bunch of plugins, that extend the masking scenarios. Please follow their internal docs.

| Package | Description | Version
|---|---|---
|[@qiwi/masker](https://github.com/qiwi/masker/tree/master/packages/facade)| Composite data masking utility with common pipeline preset | [![npm](https://img.shields.io/npm/v/@qiwi/masker/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker)
|[masquer](https://github.com/qiwi/masker/tree/master/packages/cli)| CLI for [@qiwi/masker](https://github.com/qiwi/masker/tree/master/packages/facade) | [![npm](https://img.shields.io/npm/v/masquer/latest.svg?label=&color=09e)](https://www.npmjs.com/package/masquer)
|[@qiwi/masker-common](https://github.com/qiwi/masker/tree/master/packages/common)| Masker common components: interfaces, executor, utils | [![npm](https://img.shields.io/npm/v/@qiwi/masker-common/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-common)
|[@qiwi/masker-debug](https://github.com/qiwi/masker/tree/master/packages/debug)| Debug plugin to observe pipe effects | [![npm](https://img.shields.io/npm/v/@qiwi/masker-debug/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-debug)
|[@qiwi/masker-infra](https://github.com/qiwi/masker/tree/master/packages/infra)| Infra package: build configs, tools, etc | [![npm](https://img.shields.io/npm/v/@qiwi/masker-infra/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-infra)
|[@qiwi/masker-json](https://github.com/qiwi/masker/tree/master/packages/json)| Plugin to search and parse JSONs chunks in strings | [![npm](https://img.shields.io/npm/v/@qiwi/masker-json/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-json)
|[@qiwi/masker-limiter](https://github.com/qiwi/masker/tree/master/packages/limiter)| Plugin to limit masking steps count and duration | [![npm](https://img.shields.io/npm/v/@qiwi/masker-limiter/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-limiter)
|[@qiwi/masker-pan](https://github.com/qiwi/masker/tree/master/packages/pan)| Plugin to search and conceal [PANs](https://en.wikipedia.org/wiki/Payment_card_number) | [![npm](https://img.shields.io/npm/v/@qiwi/masker-pan/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-pan)
|[@qiwi/masker-plain](https://github.com/qiwi/masker/tree/master/packages/plain)| Plugin to substitute any kind of data with `***` | [![npm](https://img.shields.io/npm/v/@qiwi/masker-plain/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-plain)
|[@qiwi/masker-schema](https://github.com/qiwi/masker/tree/master/packages/schema)| Masker schema builder and executor | [![npm](https://img.shields.io/npm/v/@qiwi/masker-schema/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-schema)
|[@qiwi/masker-secret-key](https://github.com/qiwi/masker/tree/master/packages/secret-key)| Plugin to hide sensitive data by key/path pattern match | [![npm](https://img.shields.io/npm/v/@qiwi/masker-secret-key/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-secret-key)
|[@qiwi/masker-secret-value](https://github.com/qiwi/masker/tree/master/packages/secret-value)| Plugin to conceal substrings by pattern match | [![npm](https://img.shields.io/npm/v/@qiwi/masker-secret-value/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-secret-value)
|[@qiwi/masker-split](https://github.com/qiwi/masker/tree/master/packages/split)| Executor hook to recursively process any object inners | [![npm](https://img.shields.io/npm/v/@qiwi/masker-split/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-split)
|[@qiwi/masker-strike](https://github.com/qiwi/masker/tree/master/packages/strike)| Plugin to ~~strikethough~~ any non-space string chars | [![npm](https://img.shields.io/npm/v/@qiwi/masker-strike/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-strike)
|[@qiwi/masker-trycatch](https://github.com/qiwi/masker/tree/master/packages/trycatch)| Executor hook to capture and handle exceptions | [![npm](https://img.shields.io/npm/v/@qiwi/masker-trycatch/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-trycatch)

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
