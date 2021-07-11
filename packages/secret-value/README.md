# @qiwi/masker-secret-value
Masker plugin to conceal sensitive values by pattern match.

## Install
```shell script
yarn add @qiwi/masker-secret-value
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe} from '@qiwi/masker-secret-value'

masker('fooo bar baz foobar qux q', {
  pipeline: [['secret-value', {pattern: /\w{4,}/g}]]
})
// **** bar baz ****** qux q
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
