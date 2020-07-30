import {get, set} from 'lodash'
import {IExecutionMode} from '@qiwi/substrate'
import {
  normalizeContext,
  clone,
  ahook,
  flattenObject,
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  IEnrichedContext,
  IExecutor,
  IExecutorSync,
  IMaskerDirectives,
  IMaskerPipeOutput,
  IMaskerSchema,
  IRawContext,
  ISchemaContext,
} from '@qiwi/masker-common'

export const name: IMaskerPipeName = 'schema'

const exec = ((cxt: IMaskerPipeInput) => {
  cxt.execute = withSchema(cxt.execute)
  cxt.originPipeline = cxt.originPipeline.filter((pipe) => pipe.name !== name)
  cxt.pipeline = cxt.pipeline.filter((pipe) => pipe.name !== name)

  // @ts-ignore
  cxt.context = cxt.parent = undefined

  return cxt.execute(cxt)
}) as IExecutor

export const pipe = {
  name,
  exec,
  execSync: exec,
} as IMaskerPipe

export default pipe

export const withSchema = (execute: IExecutor): IExecutor => {
  const _execute = (context: IRawContext) => {
    const sharedContext: IEnrichedContext = normalizeContext(context, _execute)
    const {schema, parent, pipeline} = sharedContext
    const pipe = pipeline[0]

    if (schema && !parent) {
      return shortCutExecute(sharedContext)
    }

    if (!pipe) {
      return context
    }

    const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
      ...res,// @ts-ignore
      schema: generateSchema({before: sharedContext, after: {...res, value: res.memo || res.value}, pipe}),
    })

    return ahook(execute(sharedContext), appendSchema)
  }

  const _execSync = ((opts) => _execute({...opts, mode: IExecutionMode.SYNC})) as IExecutorSync

  _execute.sync = _execSync
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

export const isEqual = (a: any, b: any): boolean => a === b

export const generateSchema = ({before, after, pipe: {name}}: ISchemaContext): IMaskerSchema => {
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
