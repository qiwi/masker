# @qiwi/masker
[![Build status](https://ci.appveyor.com/api/projects/status/36cy67t5tldbckce/branch/master?svg=true)](https://ci.appveyor.com/project/QIWI/masker/branch/master) [![Maintainability](https://api.codeclimate.com/v1/badges/6205424ac673cb3f2bb8/maintainability)](https://codeclimate.com/github/qiwi/masker/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/6205424ac673cb3f2bb8/test_coverage)](https://codeclimate.com/github/qiwi/masker/test_coverage)  
Composite data masking utility

### TL;DR
```ts
import {masker} from '@qiwi/masker'

masker('411111111111111')       // Promise<4111 **** **** 1111>
masker.sync('4111111111111111') // 4111 **** **** 1111
```
```shell script
npx masquer "4111 1111 1111 1111"
# returns 4111 **** **** 1111
```

## Purpose
Implement instruments, describe practices, contracts to solve sensitive data masking problem in JS/TS.
For secure logging, for public data output, for internal mimt-proxies (kuber sensitive-data-policy) and so on.

### Status
🚧 Work in progress / MVP#0 is available for testing  
⚠️ **Not ready for production yet**

### Roadmap
- [x] Implement masking composer/processor
- [x] Introduce (declarative?) masking directives: [schema](https://github.com/qiwi/masker/tree/master/packages/schema)  
- [x] Describe masking strategies and add masking utils
- [ ] Support logging tools integration

### Key features
* Both sync and async API
* Declarative configuration
* Deep customization
* TS and Flow typings

### Design
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
During the execution, pipe handler takes full control of the `context`. It can override next steps, change the `executor` impl (replace, append hook, etc), 
create internal masker threads, parallelize invocation queues and sync them back together, and so on.

### Context
```ts
export interface IMaskerPipeInput {
  value: any                // value to process
  _value?: any              // pipe result
  id: IContextId            // ctx unique key
  context: IMaskerPipeInput // ctx self ref
  parentId?: IContextId     // parent ctx id
  registry: IMaskerRegistry       // pipe registry attached to ctx
  execute: IEnrichedExecutor      // executor 
  sync: boolean                   // sync / async switch
  mode: IExecutionMode            // lagacy sync switch
  opts: IMaskerOpts               // current pipe options
  pipe?: IMaskerPipeNormalized              // current pipe ref
  pipeline: IMaskerPipelineNormalized       // actual pipeline
  originPipeline: IMaskerPipelineNormalized // origin pipeline
  [key: string]: any
}
```

## Usage
### JS/TS API
#### masker
The main interface — entry point to the masking processor.
Default `masker` may be used to handle the most basic cases: [PANs](https://en.wikipedia.org/wiki/Payment_card_number), 
passwords, tokens in strings and objects.
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

// returns
{
  token: '***',
  password: '***',
  details: {
    pans: ['4111 **** **** 1111', '1234123412341234'],
    some: 'value'
  }
}
```
You may also call `masker` with custom `pipeline` and `registry` options to override the default behavior.
```ts
masker.sync({
  token: 'foo bar',
  password: 'bazqux',
  pans: ['4111111111111111', '1234123412341234']
}, {pipeline: ['split', 'pan']})

// Only PANs were replaced
{
  token: 'foo bar',
  password: 'bazqux',
  pans: ['4111 **** **** 1111', '1234123412341234']
}
```

#### createMasker()
A factory to produce `maskers` with custom presets. Syntactic sugar for **execute()**
```ts
export const createMasker = (_opts: IMaskerFactoryOpts = {}): IMasker => {
  const _execute = (ctx: IMaskerOpts) =>
    // NOTE unbox is enabled by default
    hook(execute(ctx), (ctx.unbox ?? _opts.unbox) !== false ? unboxValue : v => v)

  const masker = (value: any, opts: IRawContext = {}): Promise<any> => _execute({..._opts, ...opts, value})
  masker.sync = (value: any, opts: IRawContext = {}): any => _execute({..._opts, ...opts, value, sync: true})

  return masker
}
```
```ts
import {createMasker, registry} from '@qiwi/masker'
const panMasker = createMasker({
  registry,
  pipeline: ['split', 'pan']
})
```
Note, when `unbox` option is set to `false`, you obtain a raw `IMaskerPipeOutput` as a result. 

#### createPipe()
A pretty simple `pipe` factory:
```ts
export const createPipe = (name: IMaskerPipeName, execSync: IMaskerPipeSync | IMaskerPipeDual, exec?: IMaskerPipeAsync | IMaskerPipeDual, opts: IMaskerPipeOpts = {}): IMaskerPipeNormalized =>
({
  name,
  execSync,
  exec: exec || asynchronize(execSync),
  opts,
})
```
You can easily introduce your own handlers for any cases.
```ts
const fooPipe = createPipe('foo', ({path, value}) =>
  path.length > 3
    ? {value: 'foo'}
    : {value}
)
masker.sync({aaaa: 'aaa', 'bbb': 'bbb'}, {pipeline: ['split', fooPipe]})
// {aaaa: 'foo', bbb: 'bbb'}
```
Pipe nesting is simple and flexible:
```ts
const fooPipe = createPipe('foo', () => ({value: 'foo'}))
const foobarPipe = createPipe('foobar', ({value, sync, context}) =>
  sync === true
    ? fooPipe.execSync({...context})
    : ({value: 'bar'})
)
```

#### pipeline
`pipeline` is an array of pipes: normalized pipes, pipe names, pipes with opts, etc:
```ts
import {pipe as splitPipe} from '@qiwi/masker-split'

const pipeline = [
  splitPipe,
  'pan',
  ['secret-value', {
    pattern: /(token|pwd|password|credential|secret)?=\s*[^ ]+/i,
  }]]
```

#### registry
`registry` is a regular `Map` that provides plugin-by-name resolution for pipelines. 
It's required for:
* pipeline normalization. You may just use pipe `name` instead of pipe ref. `['split', 'strike']`
* [masker-schema](https://github.com/qiwi/masker/tree/master/packages/schema)-like plugins to resolve masking directives.

```ts
const fooPipe = createPipe('foo', () => ({value: 'foo'}))
const barPipe = createPipe('bar', ({value}) => ({value: value + 'bar'}))
const customRegistry = new Map()
  .set(fooPipe.name, fooPipe)
  .set(barPipe.name, barPipe)

const customMasker = createMasker({
  registry: customRegistry,
  pipeline: ['foo', 'bar']
})

customMasker.sync('any') // foobar
```

#### execute()
The masker engine. Gets `context` as input, returns the last pipe's result as output.
```ts
import {createPipe as cp, execute} from '@qiwi/masker-common'

const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
const pipe2 = cp('pipe2', ({value}) => ({value: value + 'pipe2'}))
const pipeline = [pipe1, pipe2]

const value = 'foobar'

// async
await execute({pipeline, value})        // {value: 'pipe1pipe2'}

// sync
execute({pipeline, value, sync: true})  // {value: 'pipe1pipe2'}
execute.sync({pipeline, value})         // {value: 'pipe1pipe2'}
```

### CLI
```shell script
npx masquer "4111 1111 1111 1111"
# returns 4111 **** **** 1111
```

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
