# @qiwi/masker-strike
Strike masker pipe.

## Install
```shell script
yarn add @qiwi/masker-strike
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-strike";

masker.register(pipe)

masker('foo bar baz', {
  pipeline: ['strike']
})
// *** *** ***
```

