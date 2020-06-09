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
Anyway, detection of sensitive data is also crucial. This process can be implemented in different ways: regexps, functions, binary ops (PAN checksums).

### Modification
Masking is not always a complete replacement for content. It is important to maintain a balance between security and perception.
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
Paymethod: credit card 4256 **** **** 3770
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
  (target: any, next: IMasker): any
}
```

### Strategies
It is important to perform masking clearly. The main reason is that masking may be a subject of audit.
For example, if you just replace [PAN](https://en.wikipedia.org/wiki/Payment_card_number) with random numbers, it will still raise questions from the [PSI DSS](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard).
Canonical masking symbol is * (asterisk), less commonly applied — X char, even less often — • (bullet, for interactive elements like input fields).
A sequence of three characters or more indicates the masking.

The easiest way to hide is to replace content. `foobar` becomes `***`, `some long string`, right, equals `***` after masking. This is **plain** masking.  

If there's a need to keep the length of the origin text, we could replace each symbol as if crossing out. When `another string` turns into `******* ******` that means **strike** masking was applied.
Usually spaces are not masked. **NOTE** This type of symbol mapping must not be applied to passwords. **** looks like an invitation for brute force.

For some types of data, it's important to keep the format specificity. In this case, the **partial** replacement will affect only a certain fragment.
Examples: phone number `+7 *** *** 23 50`, PAN `5310 **** **** 9668`.

### Parsing
Log subsystems are the main consumer of maskers. JS log API (console-like) accepts various input types. 
Depending on structure, they pose simple or complex task for masking.
* **json** is pretty easy to iterate through `recursive map`/`deepMap`.
* **xml** requires resource-intensive parsing. Potentially contains sensitive data in text nodes or attributes.
* **url** may contain credentials in path or query parts. Access token is easy to confuse with ID, because both may be [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier).
* custom **thrift** models attaches [sensitive data flags](https://github.com/qiwi/thrift/pull/3/files).
* **pan** requires checksum verification. 

The list goes on. These features should be implemented in such a way that the masker does not become a parser. They are related, but not identical.

### Asynchronicity
There're several JS engines, which support synchronous (Rhino, Nashorn) and asynchronous (V8, Chakra) flow.
To be honest, today V8 completely dominates among them.
Therefore, it is advisable to follow async paradigm out of box if masking is resource intensive. Recommended, but optional.

Usually sync/async versions of api are presented by different functions: `fs.readFile` and `fs.readFileSync`, `execa`/`execa.sync`, etc.

```typescript
interface IMasker {
  (target: any, next: IMasker): Promise<any>
  sync?: (target: any, next: IMasker) => any
}
```
```typescript
export {
   masker,
   maskerSync
}
```

### Composability
Although high-level maskers reuse part of the functionality of basic maskers, it’s better to avoid direct dependencies.
The solution can be based on DI/IoC-container system or the plug-in system. Each custom masker should be declared as provider and be available by alias (interface / name).
In modern JS the context providers is becoming popular ([inversify](https://github.com/inversify/InversifyJS), [awilix](https://github.com/jeffijoe/awilix), [nestjs di](https://docs.nestjs.com/providers)), but not yet widespread enough.
Let there be a registry of plugins at least.
```typescript
interface MaskerRegistry {
  add(type: string, masker: IMasker): void
  remove(type: string, masker: IMasker): boolean
}
```

## Ready-made solutions
I do not dare to say that there are no libraries suitable for enterprise. Unfortunately, I could not find something noticeable that can be taken as a basis for refinement.
* [https://www.google.com/search?q=js+sensitive+data](https://www.google.com/search?q=js+sensitive+data)
* [https://www.google.com/search?q=js+data+masking](https://www.google.com/search?q=js+data+masking)
* [https://www.npmjs.com/search?q=sensitive%20data](https://www.npmjs.com/search?q=sensitive%20data)
* [https://www.npmjs.com/search?q=data%20masking](https://www.npmjs.com/search?q=data%20masking)

Well-known projects implement their own maskers where necessary. For example, [semantic-release/lib/hide-sensitive.js](https://github.com/semantic-release/semantic-release/blob/eed1d3c8cbab0ef05df39866c90ff74dff77dfa4/lib/hide-sensitive.js)
```javascript
module.exports = (env) => {
  const toReplace = Object.keys(env).filter((envVar) => {
    return /token|password|credential|secret|private/i.test(envVar) && size(env[envVar].trim()) >= SECRET_MIN_SIZE;
  });

  const regexp = new RegExp(toReplace.map((envVar) => escapeRegExp(env[envVar])).join('|'), 'g');
  return (output) =>
    output && isString(output) && toReplace.length > 0 ? output.toString().replace(regexp, SECRET_REPLACEMENT) : output;
};
```
