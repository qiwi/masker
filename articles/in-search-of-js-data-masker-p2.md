## In search of JS data masker: refinements

It is always interesting to watch how a coherent theory breaks down into harsh reality.

### Recursion
A unidirectional pipeline is applicable to strings only; nested objects require a loop to repeat. 

### Depth
Self-calling paves the way for endless cycles. We need a mechanism to limit the depth and number of recursion.
In this regard, contexts cannot be completely autonomous and should have signs of nesting.
```typescript
type IContext = {
  value: any,
  depth: number,
  id: IContextId
  context: IContext
  parent: IContext
}
```

### Directives
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

### Nesting 
Upon careful investigation of primitives, nested `JSON`/`XML` may appear in string values. This circumstance, if not ignored, brings a truly huge complexity. A little far-fetched, but conveys the essence: **json** may contain some **xml** field with an **attribute**, which is a business param for xml gateway in **json** format. 
And this single string can have **several** such pieces. So the first needed is to find their boundaries before the parsing. Then once each parsed value is modified, it's time to format everything back and put it exactly in the same place.

### Processor
A recursive pipeline is the universe of questions. It takes too much attention. It is important to keep the focus on _what_, not _how_.
The best solution would be to use any existing data processor rather than writing yet another one. At least lay on standard interfaces when describing pipes and contexts, use unary functions, etc.
I told myself after I spent weeks on this routine.
