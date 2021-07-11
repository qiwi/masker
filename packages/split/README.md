# @qiwi/masker-split
Masker plugin to recursively process any kind of js objects

## Install
```shell script
yarn add @qiwi/masker-split
```

## Usage
```typescript
import {masker} from '@qiwi/masker'
import {pipe} from '@qiwi/masker-split'

masker.sync({foo: 'bar', baz: 'qux'}, {
  pipeline: ['split', 'plain']
})

// result:
{
  '***': '***',
  '***(2)': '***'
}
```

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
