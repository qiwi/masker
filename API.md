## @qiwi/masker API
#### masker
`masker` is the main interface and the entry point to the masking processor.
Default `masker` impl covers the most basic cases: [PANs](https://en.wikipedia.org/wiki/Payment_card_number),
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
You may also invoke `masker` with a custom `pipeline` and `registry` options to override the default behavior.
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