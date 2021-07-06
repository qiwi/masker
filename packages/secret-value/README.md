# @qiwi/masker-secret-value
Masker plugin to conceal sensitive values by pattern match.

## Install
```shell script
yarn add @qiwi/masker-secret-value
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-secret-value'

masker.register(pipe)

masker('fooo bar baz foobar qux q', {
  pipeline: [['secret-value', {pattern: /\w{4,}/g}]]
})
// **** bar baz ****** qux q
```

