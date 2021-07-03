# @qiwi/masker-trycatch
The plugin to capture masker exceptions.

## Install
```shell script
yarn add @qiwi/masker-trycatch
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-trycatch";

masker.register(pipe)

masker('foobar', {
  pipeline: ['trycatch', {
    pipeline: ['plain']
  }]
})
```

