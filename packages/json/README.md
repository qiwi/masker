# @qiwi/masker-json
JSON extractor pipe.

## Install
```shell script
yarn add @qiwi/masker-json
```

## Usage
```typescript
import {masker} from '@qiwi/masker-common'
import {pipe} from "@qiwi/masker-json";

masker.register(pipe)

masker('{"foo": "bar"}  ', {
  pipeline: ['json']
})
// [{foo: 'bar'}]
```

