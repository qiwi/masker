import get from 'lodash.get'
import set from 'lodash.set'
import unset from 'lodash.unset'
import invert from 'lodash.invert'
import clone from 'lodash.clonedeep'
import {
  normalizeContext,
  hook,
  enrichExecutor,
  isEqual,
  IMaskerPipeName,
  IEnrichedContext,
  IEnrichedExecutor,
  IMaskerDirectives,
  IMaskerPipeOutput,
  IMaskerSchema,
  IRawContext,
  ISchemaContext,
  patchExecutor,
  createPipe,
  TExecutorHook, IMaskerDirective,
} from '@qiwi/masker-common'
import {randomizeKeys} from '@qiwi/masker-split'

export const name: IMaskerPipeName = 'schema'

declare module '@qiwi/masker-common' {
  interface IEnrichedContext {
    schema?: IMaskerSchema
    shortcut?: boolean
  }
}

export const withSchema: TExecutorHook = ({execute}): IEnrichedExecutor => {
  const _execute = enrichExecutor((context: IRawContext) => {
    const sharedContext: IEnrichedContext = normalizeContext(context, _execute)
    const {schema, pipe} = sharedContext

    if (schema && !sharedContext.shortcut) {
      sharedContext.shortcut = true
      return shortCutExecute(sharedContext)
    }

    if (!pipe) {
      return context
    }

    const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
      ...res,
      schema: generateSchema({before: sharedContext, after: {...res, value: res._value ?? res.value}, pipe}),
    })

    return hook(execute(sharedContext), sharedContext.shortcut ? v => v : appendSchema)
  })

  return _execute
}

const exec = patchExecutor(withSchema, name)

export const pipe = createPipe(name, exec, exec)

export default pipe

export const shortCutExecute = ({context, schema, value, sync, execute}: IEnrichedContext) => {
  if (!schema) {
    return context
  }
  const _value = clone(value)
  const {keyDirectives, valueDirectives} = extractMaskerDirectives(schema, value)
  const processDirectives = (normalizedDirectives: IDirective[], asKeys?: boolean) => normalizedDirectives.map(({path, pipeline}) =>
    execute({
      ...context,
      path: asKeys ? undefined : path,
      value: asKeys ? path.slice(path.lastIndexOf('.') + 1) : get(_value, path),
      pipeline,
    }),
  )

  const values = processDirectives(valueDirectives)
  const keys = processDirectives(keyDirectives, true)

  const inject = (target: any, values: IMaskerPipeOutput[], keys: IMaskerPipeOutput[]) => {
    values.forEach(({value}, i) => {
      const path = valueDirectives[i]?.path
      set(target, path, value)
    })

    const _keys = randomizeKeys(keys.map(({value}, i) => {
      const path = keyDirectives[i]?.path

      return path.slice(0, path.lastIndexOf('.') + 1) + value
    }))

    const keyMap = invert(keyDirectives.reduce((m, {path}, i) => {
      m[path] = _keys[i]
      return m
    }, {} as Record<string, string>))

    _keys.forEach(path => {
      const _path = keyMap[path]
      const ref = get(target, _path)

      set(target, path, ref)
      unset(target, _path)
    })

    return {...context, value: target, schema}
  }

  return sync
    // @ts-ignore
    ? inject(_value, values as IMaskerPipeOutput[], keys as IMaskerPipeOutput[])
    : Promise.all([Promise.all(values), Promise.all(keys)]).then(([values, keys]) => inject(_value, values, keys))
}

export type IPath = string

export type TNormalizedMaskerDirectives = [IPath, IMaskerDirectives][]

export type TNormalizedMaskerDirectivesMap = {
  valueDirectives: TNormalizedMaskerDirectives
  keyDirectives: TNormalizedMaskerDirectives
}

interface IDirective {
  path: string
  pipeline: IMaskerDirective[]
  type: string
  depth: number
}

interface IDirectivesMap {
  valueDirectives: IDirective[]
  keyDirectives: IDirective[]
}

const isObject = (value: any): boolean => value !== null && typeof value === 'object'

const joinPath = (a: string, b: string): string => a ? `${a}.${b}` : b

export const extractMaskerDirectives = (
  {type, properties, keyDirectives, valueDirectives, items}: IMaskerSchema,
  value: any,
  path = '',
  memo: IDirectivesMap = {
    valueDirectives: [],
    keyDirectives: [],
  },
  depth = 0): IDirectivesMap => {

  if (keyDirectives?.length) {
    memo.keyDirectives.push({pipeline: keyDirectives, path, type, depth})
  }

  if (valueDirectives?.length) {
    memo.valueDirectives.push({pipeline: valueDirectives, path, type, depth})
  }

  if (isObject(properties)) {
    Object.entries(properties as Record<any, any>).forEach(([_k, _v]) => {
      extractMaskerDirectives(_v, value,joinPath(path, _k), memo, depth + 1)
    })
  }

  if (isObject(items)) {
    if (Array.isArray(items)) {
      Object.entries(items as Record<any, any>)
        .forEach(([_k, _v]) => extractMaskerDirectives(_v, value, joinPath(path, _k), memo, depth + 1))
    }
    // Get object's own keys if `items` is in common notation
    else {
      const _value = get(value, path)
      if (isObject(_value)) {
        Object.keys(_value)
          .forEach(_k => extractMaskerDirectives(items as IMaskerSchema, value,joinPath(path, _k), memo, depth + 1))
      }
    }
  }

  if (depth === 0) {
    memo.keyDirectives.sort((a, b) => b.depth - a.depth)
    memo.valueDirectives.sort((a, b) => b.depth - a.depth)
  }

  return memo
}

export const generateSchema = ({before, after, pipe: {name}}: ISchemaContext): IMaskerSchema => {
  const type = getSchemaType(before.value)
  const schema = extractSchemaFromResult(type, after)

  if (type !== 'object' && type !== 'array' && !isEqual(before.value, after.value)) {
    schema.valueDirectives = schema?.valueDirectives || []
    schema.valueDirectives.push(name)
  }

  return schema
}

export const extractSchemaFromResult = (type: string, after: IMaskerPipeOutput): IMaskerSchema => {
  if (after.schema) {
    return {
      ...after.schema,
      type,
    }
  }

  if (typeof after.value === 'object' && after.value !== null) {
    const {values, origin, keys} = after.value._split_ || {}
    const isArray = Array.isArray(after.value)

    if (values) {
      const properties = Object.keys(origin).reduce((m, v: string, i: number) => {
        const keyDirectives = keys[i]?.schema?.valueDirectives
        const schema = values[i].schema
        m[v] = keyDirectives ? {...schema, keyDirectives} : schema

        return m
      }, isArray ? [] : {} as Record<string, any>)

      if (isArray) {
        const snapshot = JSON.stringify(properties[0])
        // compaction: if all items schemas are equal, use a single declaration
        const items = Object.values(properties)
          // FIXME Use normal comparator: _.eq or smth similar
          .every((item) => JSON.stringify(item) === snapshot)
          ? properties[0]
          : properties
        return {type, items}
      }

      return {
        type,
        properties,
      }
    }
  }

  return {type}
}

export const getSchemaType = (value: any): string =>
  Array.isArray(value)
    ? 'array'
    : value === null
      ? 'null'
      : typeof value
