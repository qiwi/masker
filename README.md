# @qiwi/masker
Composite data masking utility.

## Goal
Implement instruments, describe practices, contracts to solve sensitive data masking problem in JS/TS.
For logs, for public data output and so on.

## Roadmap
- [ ] Introduce (declarative?) masking directives  
- [ ] Describe masking strategies and add masking utils  
- [ ] Implement masking composer/processor  
- [ ] Support logging tools integration  

## Motivation
The most maskers use complex analyzers to separate objects that should be hidden. 
They examine field names (like "password", "token") or data formats (like card pans) to the entire depth of jsons or xmls. 
But it’s impossible to cover all cases fully automatically. Sometimes the masking rule can be defined only in the business logic context.
The stage in which we determine the need for data masking and the stage of data output are ofter located in different directly unrelated layers.
The obvious solution is simply to define custom `valueOf` and `toString` methods. But immediately various side effects arise.
For example `valueOf` can be used for comparison operations in some util. Moreover, `console.log()` [does debug magic](https://stackoverflow.com/questions/36215379/does-console-log-invokes-tostring-method-of-an-object) and ignore these implementations.
Maybe mark field as [non-enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)? 
This tricks console logger, but breaks any serializer which iterates through `for ... in`.
In short, any distortions entails technical difficulties.

### SoC
It must be accepted that masking and logging (any output) are different areas of responsibility.
The masker may be a part of logging pipeline, but it's not required.
We could not try to modify the target near the output point, but create a masked companion entity in the business layer and just bind them through some shared `WeakMap`.
```javascript
// Logger util layer
const maskedStore = new WeakMap()
const logger = (...args) =>
  console.log(...args.map(value => 
    maskedStore.has(value)
      ? maskedStore(value)
      : value
))

// Business logic
const a = {smthToHide: 'sensitive data', foo: 'bar'}
maskedStore.set(a, {...a, smthToHide: '***'})
```
[`Reflect.metadata`](https://github.com/rbuckton/reflect-metadata) can also be used for the same purpose. Or even [cls-context](https://github.com/jeff-lewis/cls-hooked).
 
### Directives
The next stage of abstraction is the transition from the direct masked object creation and binding to the delegation of this function to a separate subsystem.
This feature requires a declarative contract instructions or masking directives which can be interpreted.
By analogy with how [json-schema](https://json-schema.org/), we'll be able to use various implementations in the future. _Depend upon abstractions, not concretions._
It is advisable to inherit well-known contract as a basis.
```typescript
interface IMaskerDirective {
  type: string    // masking type
  value?: any     // replacement entity reference
  options?: any   // options for current `type` of masker
  description?: string // optional comment 
  properties?: Record<string, IMaskerDirective> // Directives for nested props
  definitions?: Record<string, IMaskerDirective>,
  $ref?: string
}
```

## Masker
Reflecting on what the masker does, it is obvious that everything comes to two fundamental things: search and change data.
### Detection
Schema-based approach applicable if we know the essence of masked data, if we control the point where its created. 
In practice, we use frameworks that manage internal layers of data independently and unmanageable from the outside.
On very lucky, there is a way to inject your custom _masking logger_. Often, for greater reliability, we have to hang a hook on `stdout/stderr` or override native `console`.
Anyway, detection of sensitive data is also crucial. This process can be implemented in different ways: regexps, functions, binary ops (pan checksums).

### Modification
Masking is not always a complete replacement for content. It is important to strike a balance between security and perception.
For clarity, imagine user payments history:
```
Recipient: *** (personal data)
Sum: $25.00
Paymethod: credit card *** (sensitive data)
```
With a comparable level of security, this might be in more useful form.
```
Recipient: J.S***d
Sum: $25.00
Paymethod: credit card 4245 **** **** **54
```
So modificators should provide the minimum necessary, but not the maximum possible level of data distortion required for a specific context.

### Chain of responsibility
The reasoning above suggests the following `IMasker` contract.
```typescript
interface IMasker {
  detect: (target: any) => any,
  modify: (target: any, detected: any[]) => any
}
```
Simple, clear and easy to compose, but it also involves some limitations.  
Here's the case: 
```typescript
{
  token: {
    type: 'bearer',
    value: 'some string'    
  }
}
```
What should be the final result?
1) `token: '***'`
2) `token: '*** (object)'`
3) `token: {type: '***', value: '***'}}`
4) `token: {type: 'bearer', value: '***'}}`

If we strive for option 4, we need to place additional logic somewhere, that transcends the liability of `detect` and `modify`. Let it be in a _controller_. 
```typescript
interface IMasker {
  (target: any, next: IMasker) => any
}
```
