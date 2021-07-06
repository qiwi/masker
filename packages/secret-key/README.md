# @qiwi/masker-secret-key
Hide sensitive data by key/path pattern match

## Install
```shell script
yarn add @qiwi/masker-secret-key
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-secret-key'

masker.register(pipe)

masker({ secret: 'foo' }, {
  pipeline: [['secret-key', {pattern: /secret/g, pupeline: ['plain']}]]
})
// {secret: '***'}
```

