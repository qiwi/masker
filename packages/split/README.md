# @qiwi/masker-split

## Install
```shell script
yarn add @qiwi/masker-split
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-split'

masker.register(pipe)

masker({foo: 'bar', baz: 'qux'}, {
  pipeline: ['split']
})
```

