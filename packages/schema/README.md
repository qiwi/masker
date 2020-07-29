# @qiwi/masker-schema
Masker schema processor.

## Install
```shell script
yarn add @qiwi/masker-schema
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-schema";

masker.register(pipe)

masker('foo bar baz', {
  pipeline: ['schema']
})
```

