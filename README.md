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
- [ ] Describe masking strategies and add masking utils  
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

/*
{
  token: '***',
  password: '***',
  details: {
    pans: ['4111 **** **** 1111', '1234123412341234'],
    some: 'value'
  }
}
*/
```
