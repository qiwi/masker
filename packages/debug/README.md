# @qiwi/masker-debug
The plugin to debug masker pipes effects.

## Install
```shell script
yarn add @qiwi/masker-debug
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-debug"

masker.register(pipe)

masker('foobar', {
  pipeline: ['debug']
})
```

