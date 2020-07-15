# @qiwi/masker-plain
Plain masker pipe

## Install
```shell script
yarn add @qiwi/masker-plain
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-plain";

masker.register(pipe)

masker('foobar', {
  pipeline: ['plain']
})
// ***
```

