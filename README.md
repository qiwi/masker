# @qiwi/masker
Composite data masking utility

## Goal
Implement instruments, describe practices, contracts to solve sensitive data masking problem in JS/TS.
For logs, for public data output and so on.

## Status
🚧 Work in progress 🚧 / Experimental / Early preview

### Roadmap
- [x] Implement masking composer/processor
- [x] Introduce (declarative?) masking directives: [schema](https://github.com/qiwi/masker/tree/master/packages/schema)  
- [x] Describe masking strategies and add masking utils  
- [ ] Support logging tools integration  

### Working drafts
```ts
import {masker} from '@qiwi/masker'

masker('411111111111111')       // Promise<4111 **** **** 1111>
masker.sync('4111111111111111') // 4111 **** **** 1111

masker.sync({
  token: 'foo bar',
  password: 'bazqux',
  details: {
    pans: ['4111111111111111', '1234123412341234'],
    some: 'value'
  }
})

// returns
{
  token: '***',
  password: '***',
  details: {
    pans: ['4111 **** **** 1111', '1234123412341234'],
    some: 'value'
  }
}
```
```shell script
npx masquer "4111 1111 1111 1111"

# returns 4111 **** **** 1111
```

## Packages
| Package | Description | Version
|---|---|---
|[@qiwi/masker](https://github.com/qiwi/masker/tree/master/packages/facade)| Composite data masking utility with common pipeline preset | [![npm](https://img.shields.io/npm/v/@qiwi/masker/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker)
|[masquer](https://github.com/qiwi/masker/tree/master/packages/cli)| CLI for [@qiwi/masker](https://github.com/qiwi/masker/tree/master/packages/facade) | [![npm](https://img.shields.io/npm/v/masquer/latest.svg?label=&color=09e)](https://www.npmjs.com/package/masquer)
|[@qiwi/masker-common](https://github.com/qiwi/masker/tree/master/packages/common)| Masker common components: interfaces, executor, utils | [![npm](https://img.shields.io/npm/v/@qiwi/masker-common/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-common)
|[@qiwi/masker-debug](https://github.com/qiwi/masker/tree/master/packages/debug)| Debug plugin to observe pipe effects | [![npm](https://img.shields.io/npm/v/@qiwi/masker-debug/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-debug)
|[@qiwi/masker-json](https://github.com/qiwi/masker/tree/master/packages/json)| Plugin to search and parse JSONs chunks in strings | [![npm](https://img.shields.io/npm/v/@qiwi/masker-json/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-json)
|[@qiwi/masker-limiter](https://github.com/qiwi/masker/tree/master/packages/limiter)| Plugin to limit masking steps count and duration | [![npm](https://img.shields.io/npm/v/@qiwi/masker-limiter/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-limiter)
|[@qiwi/masker-pan](https://github.com/qiwi/masker/tree/master/packages/pan)| Plugin to search and conceal [PANs](https://en.wikipedia.org/wiki/Payment_card_number) | [![npm](https://img.shields.io/npm/v/@qiwi/masker-pan/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-pan)
|[@qiwi/masker-plain](https://github.com/qiwi/masker/tree/master/packages/plugin)| Plugin to substitute any kind of data with `***` | [![npm](https://img.shields.io/npm/v/@qiwi/masker-plain/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-plain)
|[@qiwi/masker-schema](https://github.com/qiwi/masker/tree/master/packages/schema)| Masker schema builder and executor | [![npm](https://img.shields.io/npm/v/@qiwi/masker-schema/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-schema)
|[@qiwi/masker-secret-key](https://github.com/qiwi/masker/tree/master/packages/secret-key)| Plugin to hide sensitive data by key/path pattern match | [![npm](https://img.shields.io/npm/v/@qiwi/masker-secret-key/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-secret-key)
|[@qiwi/masker-secret-value](https://github.com/qiwi/masker/tree/master/packages/secret-value)| Plugin to conceal substrings by pattern match | [![npm](https://img.shields.io/npm/v/@qiwi/masker-secret-value/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-secret-value)
|[@qiwi/masker-split](https://github.com/qiwi/masker/tree/master/packages/split)| Executor hook to recursively process any object inners | [![npm](https://img.shields.io/npm/v/@qiwi/masker-split/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-split)
|[@qiwi/masker-strike](https://github.com/qiwi/masker/tree/master/packages/strike)| Plugin to ~~strikethough~~ any non-space string chars | [![npm](https://img.shields.io/npm/v/@qiwi/masker-strike/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-strike)
|[@qiwi/masker-trycatch](https://github.com/qiwi/masker/tree/master/packages/trycatch)| Executor hook to capture and handle exceptions | [![npm](https://img.shields.io/npm/v/@qiwi/masker-trycatch/latest.svg?label=&color=09e)](https://www.npmjs.com/package/@qiwi/masker-trycatch)

## License
[MIT](https://github.com/qiwi/masker/blob/master/LICENSE)
