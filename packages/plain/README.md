# @qiwi/masker-plain
Plain masker pipe

## Install
```shell script
yarn add @qiwi/masker-plain
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe as plain} from '@qiwi/masker-plain'

masker('foobar', {
  pipeline: [plain]
})
// ***
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
