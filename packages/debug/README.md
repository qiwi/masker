# @qiwi/masker-debug
The plugin to debug masker pipes effects.

## Install
```shell script
yarn add @qiwi/masker-debug
```

## Usage
```typescript
import {masker, createPipe} from '@qiwi/masker-common'
import {pipe as debug} from '@qiwi/masker-debug'

const success = createPipe('success', () => ({value: 'success'}))

// Enable debugger in any way:
// * Set DEBUG=masker
// * require('debug').enable('masker')

masker.sync('foobar', {
  pipeline: [debug, success]
})
```

```shell
masker before <ref *2> {
  value: 'foobar',
  registry: Map(0) {},
  sync: true,
  mode: 'sync',
  execute: <ref *1> [Function (anonymous)] {
    sync: [Function: t],
    execSync: [Function: t],
    exec: [Circular *1]
  },
  pipe: {
    name: 'success',
    execSync: [Function (anonymous)],
    exec: [Function (anonymous)],
    opts: {}
  },
  id: '57295723',
  parentId: undefined,
  pipeline: [
    {
      name: 'success',
      execSync: [Function (anonymous)],
      exec: [Function (anonymous)],
      opts: {}
    }
  ],
  originPipeline: [
    {
      name: 'success',
      execSync: [Function (anonymous)],
      exec: [Function (anonymous)],
      opts: {}
    }
  ],
  opts: {},
  context: [Circular *2]
} +0ms
```

## License
MIT
