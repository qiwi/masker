# @qiwi/masker-pan
Pan masker pipe

## Install
```shell script
yarn add @qiwi/masker-pan
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-pan"

masker.register(pipe)

masker('4111111111111111', {
  pipeline: ['pan']
})
// 4111 **** **** 1111
```

