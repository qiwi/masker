# @qiwi/masker-sensor
Hide sensitive data by path match

## Install
```shell script
yarn add @qiwi/masker-sensor
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-sensor";

masker.register(pipe)

masker('fooo bar baz foobar qux q', {
  pipeline: [['sensor', {pattern: /\w{4,}/g}]]
})
// **** bar baz ****** qux q
```

