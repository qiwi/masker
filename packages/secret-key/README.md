# @qiwi/masker-secret-key
Hide sensitive data by key/path pattern match

## Install
```shell script
yarn add @qiwi/masker-secret-key
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe as secretKey} from '@qiwi/masker-secret-key'

masker({ secret: 'foo' }, {
  pipeline: [[secretKey, {pattern: /secret/g, pupeline: ['plain']}]]
})
// {secret: '***'}
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
