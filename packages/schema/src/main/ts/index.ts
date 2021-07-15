import get from 'lodash.get'
import set from 'lodash.set'
import unset from 'lodash.unset'
import invert from 'lodash.invert'
import clone from 'lodash.clonedeep'
import {flattie as flattenObject} from 'flattie'
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
  ISchemaContext, patchExecutor, createPipe, TExecutorHook,
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
  const {keyDirectives, valueDirectives} = extractMaskerDirectives(schema)
  const processDirectives = (normalizedDirectives: TNormalizedMaskerDirectives, asKeys?: boolean) => normalizedDirectives.map(([path, directives]) =>
    execute({
      ...context,
      path: asKeys ? undefined : path,
      value: asKeys ? path.slice(path.lastIndexOf('.') + 1) : get(_value, path),
      pipeline: directives,
    }),
  )

  const values = processDirectives(valueDirectives)
  const keys = processDirectives(keyDirectives, true)

  const inject = (target: any, values: IMaskerPipeOutput[], keys: IMaskerPipeOutput[]) => {
    values.forEach(({value}, i) => {
      const path = valueDirectives[i]?.[0]
      set(target, path, value)
    })

    const _keys = randomizeKeys(keys.map(({value}, i) => {
      const path = keyDirectives[i]?.[0]

      return path.slice(0, path.lastIndexOf('.') + 1) + value
    }))

    const getDepth = (str: string): number => (str.match(/\./g))?.length || 0

    const keyMap = invert(keyDirectives.reduce((m, [path], i) => {
      m[path] = _keys[i]
      return m
    }, {} as Record<string, string>))

    _keys.sort((a, b) => getDepth(b) - getDepth(a)).forEach(path => {
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

const getPropPath = (schemaPath: IPath): IPath => schemaPath.slice(0, schemaPath.lastIndexOf('.'))
  .split(/properties\.([^.]+)/g)
  .join('')

const getDirectivesByPath = (schema: IMaskerSchema, path: IPath) => get(schema, path) as IMaskerDirectives

const injectDirective = (normalizedDirectives: TNormalizedMaskerDirectives, path: IPath, schema: IMaskerSchema): TNormalizedMaskerDirectives => {
  normalizedDirectives.push([getPropPath(path), getDirectivesByPath(schema, path)])

  return normalizedDirectives
}

export const extractMaskerDirectives = (schema: IMaskerSchema): TNormalizedMaskerDirectivesMap =>
    Object.keys(flattenObject(schema))
        .reduce((m, key: string) => {
          const [, valueDirectivesPath] = key.match(/^(.+\.valueDirectives)\.\d+$/) || []
          const [, keyDirectivesPath] = key.match(/^(.+\.keyDirectives)\.\d+$/) || []

          if (valueDirectivesPath) injectDirective(m.valueDirectives, valueDirectivesPath, schema)
          if (keyDirectivesPath) injectDirective(m.keyDirectives, keyDirectivesPath, schema)

          return m
        }, {
          valueDirectives: [],
          keyDirectives: [],
        })

export const generateSchema = ({before, after, pipe: {name}}: ISchemaContext): IMaskerSchema => {
  const type = getSchemaType(before.value)
  const schema = extractSchemaFromResult(type, after)

  if (type !== 'object' && !isEqual(before.value, after.value)) {
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

    if (values) {
      const properties = Object.keys(origin).reduce((m, v: string, i: number) => {
        const keyDirectives = keys[i]?.schema?.valueDirectives
        const schema = values[i].schema
        m[v] = keyDirectives ? {...schema, keyDirectives} : schema

        return m
      }, {} as Record<string, any>)

      return {
        type,
        properties,
      }
    }
  }

  return {type}
}

export const getSchemaType = (value: any): string =>
  typeof value === 'string'
    ? 'string'
    : typeof value === 'object' && value !== null
      ? 'object'
      : 'unknown'
