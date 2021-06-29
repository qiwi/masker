# @qiwi/masker-common
Masker common components: interfaces, executor, utils

## Install
```shell
yarn add @qiwi/masker-common
```

## Usage
### `createPipe()`
Creates a pipe entity. Several pipes are combined into a `pipeline` to be processed by `executor`.
```ts
import {createPipe} from '@qiwi/masker-common'

const pipe = createPipe('foo', () => ({value: 'syncfoo'}), async () => ({value: 'asyncfoo'}))

pipe.name       // 'foo'
pipe.sync({})   // {value: 'syncfoo'}
await pipe({})  // {value: 'asyncfoo'}
```

### `getPipe()`
Get pipe from registry.
```ts
import {getPipe, crearePipe as cp} from '@qiwi/masker-common'

const pipe = cp('foo', () => ({value: 'foo'}))
const registry = new Map()

registry.set('foo', pipe)
getPipe('foo', registry) // pipe
```

### `execute()`
```ts
import {createPipe as cp, execute} from '@qiwi/masker-common'

const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
const pipe2 = cp('pipe2', ({value}) => ({value: value + 'pipe2'}))
const pipeline = [pipe1, pipe2]

const value = 'foobar'
const result = await execute({pipeline, value}) // {value: 'pipe1pipe2'}
```

### License
MIT