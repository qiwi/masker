# @qiwi/masker-secret
Hide sensitive data by pattern match

## Install
```shell script
yarn add @qiwi/masker-secret
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-secret'

masker.register(pipe)

masker('fooo bar baz foobar qux q', {
  pipeline: [['secret', {pattern: /\w{4,}/g}]]
})
// **** bar baz ****** qux q
```

