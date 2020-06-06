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
The stage in which we determine the need for data masking and the stage of data output often lay in different layers.
If we define custom `valueOf` or `toString` methods for target (the top of my head), this can bring some side effects. 
For example `valueOf` can be used for comparison operations. Moreover, `console.log()` [does debug magic](https://stackoverflow.com/questions/36215379/does-console-log-invokes-tostring-method-of-an-object) and ignore these implementations.
Maybe mark field as [non-enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)? 
This tricks console logger, but breaks any serializer which iterates through `for ... in`.
In short, any distortions entails technical difficulties.
