import {IMaskerDirectives, IMaskerSchema, ISchemaContext} from './interfaces'
import {flattenObject, isEqual} from './utils'
import {get} from 'lodash'

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
