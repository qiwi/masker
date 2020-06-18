## In search of JS data masker: refinements

It is always interesting to watch how a coherent theory breaks down into harsh reality.

### Recursion
A unidirectional pipeline is applicable to strings; nested objects require a loop to repeat.

### Directives: masking type
The hypothesis that only one handler can be applied to a field was rejected first.
The resolution of the json-schema-like notation does not allow to have pointers for tokens inside the value.
```javascript
{
  field: "text with PAN 4333 2434 1344 5346 and JWT token.may.occur in simultaneously"
}
```
So `type` definition should be a more complex object. At least an array.
In addition, `type` is naturally perceived as a property of an object, not a masker. Therefore, it is better to use a different name.
Without changing the role of control fields, we can use the scheme for validation purposes as usual.
```javascript
{
  type: 'string',
  masker: ['pan', 'jwt']
}
```
