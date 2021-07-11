# @qiwi/masker-trycatch
The plugin to capture masker exceptions.

## Install
```shell script
yarn add @qiwi/masker-trycatch
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {createPipe} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-trycatch'

const errorPipe = createPipe('err', () => {
  throw new Error('Error')
})

masker.sync('foobar', {
  pipeline: [['trycatch', {pipeline: ['plain']}], errorPipe]
})

// '***'
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)

