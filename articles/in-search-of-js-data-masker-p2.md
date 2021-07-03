## In search of JS data masker: refinements

It's always interesting to watch how a _coherent_ theory breaks down into harsh reality.

### Recursion
A unidirectional pipeline is applicable to strings only. 
Complex entries (like arrays, plain objects, errors) require a loop.
Thus, we wrap the end of some chains in the middle of others.

```ts
export const assemble = (values: IMaskerPipeOutput[], keys: IMaskerPipeOutput[], origin: any) => {
  const mapped = {keys, values, origin}
  const target: Record<string, any> = Array.isArray(origin) ? [] : {}
  const _values = values.map(unboxValue)
  const _keys = keys.map(unboxValue)
  const result = randomizeKeys(_keys).reduce((m, k, i) => {
    m[k] = _values[i]
    return m
  }, target)

  return {value: defineNonEnum(result, '_split_', mapped)}
}

export const name: IMaskerPipeName = 'split'

export const process = ({context, originPipeline, execute, value}: IEnrichedContext, skipPath?: boolean, keys: string[] = Object.keys(value)) => <K>(k: K, i: number) => skipPath && Array.isArray(value)
  ? ({value: k} as IMaskerPipeOutput)
  : execute({...context, pipeline: originPipeline, path: skipPath ? undefined : appendPath(keys[i], context.path), value: k})

export const pipe: IMaskerPipe = createPipe(
  name,
  ({value, context}: IMaskerPipeInput) =>
    (typeof value === 'object' && value !== null
      ? ((origin) => {
        const values = Object.values(origin).map(process(context)) as IMaskerPipeOutput[]
        const keys = Object.keys(origin).map(process(context, true)) as IMaskerPipeOutput[]

        return assemble(values, keys, origin)

      })(value)
      : {value}),
```

### Depth
Self-calling pipes may bring endless cycles. We need a mechanism to limit the depth of recursion.
In this regard, contexts cannot be completely autonomous and should have some signs of nesting.
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
The hypothesis that only one handler can be applied to a field was rejected.
The resolution of the json-schema-like notation does not allow to have pointers for tokens inside the value.
```javascript
{
  field: "text with PAN 4333 2434 1344 5346 and JWT token.may.occur in simultaneously"
}
```
So masker `type` definition should be a bit more complex.
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
And this single string can have **several** such pieces. So the first needed is to find their boundaries before the parsing. Once each parsed value is modified, it's time to format everything back and put it exactly in the same place.

### Processor
A recursive pipeline is the universe of questions. It takes too much attention. It is important to keep the focus on _what_, not _how_.
The best solution would be to use any existing data processor rather than writing yet another one. At least lay on standard interfaces when describing pipes and contexts, use unary functions, etc.
I told myself after I spent weeks on this routine.

### Fallbacks
No matter how hard you try, it's impossible to completely avoid errors. This will require a fallback handler or a separate pipeline for exceptions.
This will also require containerizing the return value, [either monad](https://blog.logrocket.com/elegant-error-handling-with-the-javascript-either-monad-76c7ae4924a1/) or something like that.
```typescript
type TValue = {
  error: any,
  success: any
}
```

### Coupling
When I talk about tight connectivity, I was referring to the contexts of masker using. Practice has shown that explicit and implicit dependencies between the masker pipes are the much bigger problem.
In order not to fall further into this hell of growing complexity, I had to make a pipeline processor inside the pipeline processor. This is a pure madness.
```typescript
  // ...
  const memo: THookCallback = (res) => ((_memo = res.value), res)
  const restore: THookCallback = (res) => ((res.memo = _memo), res)
  const next: THookCallback = (res) => _execute({
    ...sharedContext,
    ...res,
    pipeline: res.pipeline || pipeline.slice(1),
  })

  return ahook(ahook(ahook(fn(sharedContext), memo), next), restore) // Pipeline inside pipeline executor.
```