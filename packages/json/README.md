# @qiwi/masker-json
JSON extractor pipe

## Install
```shell script
yarn add @qiwi/masker-json
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {json} from '@qiwi/masker-json'
import {split} from '@qiwi/masker-split'
import {strike} from '@qiwi/masker-strike'

masker('{"foo": "bar"}  ', {
  pipeline: [json, split, strike]
})
// '{"foo": "***"}  '
```

