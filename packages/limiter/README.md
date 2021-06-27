# @qiwi/masker-limiter
The plugin to limit masking steps and duration

## Install
```shell script
yarn add @qiwi/masker-limiter
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-limiter";

masker.register(pipe)

masker('foobar', {
  pipeline: ['limiter', {
    limit: 20,
    duration: 100
  }]
})
```

