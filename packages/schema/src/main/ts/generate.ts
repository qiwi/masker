import {IMaskerPipeOutput, ISchemaContext, isEqual} from '@qiwi/masker-common'
import {IMaskerSchema} from './interfaces'
import {isObject} from './utils'

export const generateSchema = ({before, after, pipe: {name}}: ISchemaContext): IMaskerSchema => {
  const type = getSchemaType(before.value)
  const schema = extractSchemaFromResult(type, after)

  if (type !== 'object' && type !== 'array' && !isEqual(before.value, after.value)) {
    schema.maskValue = schema?.maskValue || []
    schema.maskValue.push(name)
  }

  return schema
}

// If all items schemas are equal, use a single declaration
const compactItemsSchema = (properties: Record<any, any>) => {
  const snapshot = JSON.stringify(properties[0])

  return Object.values(properties)
    // FIXME Use normal comparator: _.eq or smth similar
    .every((item) => JSON.stringify(item) === snapshot)
    ? properties[0]
    : properties
}

export const extractSchemaFromResult = (type: string, after: IMaskerPipeOutput): IMaskerSchema => {
  if (after.schema) {
    return {
      ...after.schema,
      type,
    }
  }

  if (isObject(after.value)) {
    const {values, origin, keys} = after.value._split_ || {}
    const isArray = Array.isArray(after.value)

    if (values) {
      const properties = Object.keys(origin).reduce((m, v: string, i: number) => {
        const maskKey = keys[i]?.schema?.maskValue
        const schema = values[i].schema
        m[v] = maskKey ? {...schema, maskKey} : schema

        return m
      }, isArray ? [] : {} as Record<string, any>)

      return isArray
        ? {type, items: compactItemsSchema(properties)}
        : {type, properties}
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
