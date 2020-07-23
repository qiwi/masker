import {IExecutionMode} from '@qiwi/substrate'
import {
  IEnrichedContext,
  IExecutor,
  IExecutorSync,
  IMaskerDirectives,
  IMaskerPipeOutput,
  IMaskerSchema,
  IRawContext,
  ISchemaContext,
} from './interfaces'
import {clone, flattenObject, isEqual, isPromiseLike} from './utils'
import {normalizeContext} from './context'
import {get, set} from 'lodash'
import {getPipe} from './pipe'

export const withSchema = (execute: IExecutor): IExecutor => {
  const _execute = (context: IRawContext) => {
    const sharedContext: IEnrichedContext = normalizeContext(context, _execute)
    const {schema, parent, pipeline, registry} = sharedContext
    const pipe = getPipe(pipeline[0], registry)

    if (schema && !parent) {
      return shortCutExecute(sharedContext)
    }

    if (!pipe) {
      return context
    }

    const res = execute(sharedContext)
    const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
      ...res,// @ts-ignore
      schema: generateSchema({before: sharedContext, after: res, pipe}),
    })

    return isPromiseLike(res)
      ? (res as Promise<IMaskerPipeOutput>).then(appendSchema)
      : appendSchema(res as IMaskerPipeOutput)
  }

  const _execSync = ((opts) => _execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync

  _execute.sync = _execSync // () => {throw new Error('QQQQQ')}//
  _execute.execSync = _execSync
  _execute.exec = _execute

  return _execute
}

export const shortCutExecute = ({context, schema, value, mode, execute}: IEnrichedContext) => {
  if (!schema) {
    return context
  }

  const _value = clone(value)
  const directives = extractMaskerDirectives(schema)
  const inject = (outputs: IMaskerPipeOutput[]): IMaskerPipeOutput => {
    outputs.forEach(({value}, i) => {
      const path = directives[i]?.[0]
      set(_value, path, value)
    })

    return {...context, value: _value, schema}
  }
  const values = directives.map(([path, directives]) =>
    execute({
      ...context,
      value: get(_value, path),
      pipeline: directives,
    }),
  )

  return mode === IExecutionMode.ASYNC
    ? Promise.all(values).then(inject)
    : inject(values as IMaskerPipeOutput[])
}

export const extractMaskerDirectives = (schema: IMaskerSchema): Array<[string, IMaskerDirectives]> =>
  Object.keys(flattenObject(schema))
    .reduce((m: Array<[string, IMaskerDirectives]>, key: string) => {
      const [, directivePath] = key.match(/^(.+\.maskerDirectives)\.\d+$/) || []

      if (directivePath) {
        const directives = get(schema, directivePath) as IMaskerDirectives
        const path = directivePath.slice(0, directivePath.lastIndexOf('.'))
          .split(/properties\.([^.]+)/g)
          .join('')

        m.push([path, directives])
      }
      return m
    }, [])

export const generateSchema = ({before, after, pipe: {masker: {name}}}: ISchemaContext): IMaskerSchema => {
  const type = getSchemaType(before.value)
  const schema: IMaskerSchema = {
    type,
    ...after.schema,
  }

  if (type !== 'object' && !isEqual(before.value, after.value)) {
    schema.maskerDirectives = after?.schema?.maskerDirectives || []
    schema.maskerDirectives.push(name)
  }

  return schema
}

export const getSchemaType = (value: any): string =>
  typeof value === 'string'
    ? 'string'
    : typeof value === 'object' && value !== null
      ? 'object'
      : 'unknown'
