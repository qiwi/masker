# @qiwi/masker-pan
PAN masker pipe

## Install
```shell script
yarn add @qiwi/masker-pan
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe as pan} from "@qiwi/masker-pan"

masker('4111111111111111', {
  pipeline: [pan]
})
// 4111 **** **** 1111
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
