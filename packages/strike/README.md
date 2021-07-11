# @qiwi/masker-strike
The plugin to ~~strikethough~~ any non-space string chars.

## Install
```shell script
yarn add @qiwi/masker-strike
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe} from '@qiwi/masker-strike'

masker.sync('foo bar baz', {
  pipeline: ['strike']
})
// *** *** ***
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
