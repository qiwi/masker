# @qiwi/masker-strike
The plugin to ~~strikethough~~ any non-space string chars.

## Install
```shell script
yarn add @qiwi/masker-strike
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from '@qiwi/masker-strike'

masker.register(pipe)

masker('foo bar baz', {
  pipeline: ['strike']
})
// *** *** ***
```

