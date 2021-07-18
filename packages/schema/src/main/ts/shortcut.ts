import {IEnrichedContext, IMaskerPipeOutput} from '@qiwi/masker-common'
import {randomizeKeys} from '@qiwi/masker-split'
import clone from 'lodash.clonedeep'
import get from 'lodash.get'
import set from 'lodash.set'
import invert from 'lodash.invert'
import unset from 'lodash.unset'

import {isObject, joinPath} from './utils'
import {
  IDirectivesMap,
  IMaskerDirective,
  IMaskerDirectiveNormalized,
  IMaskerSchema,
} from './interfaces'

export const shortCutExecute = ({context, schema, value, sync, execute}: IEnrichedContext) => {
  if (!schema) {
    return context
  }
  const _value = clone(value)
  const {keyDirectives, valueDirectives} = extractMaskerDirectives(schema, value)
  const processDirectives = (normalizedDirectives: IMaskerDirectiveNormalized[], asKeys?: boolean) => normalizedDirectives.map(({path, pipeline}) =>
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

export const extractMaskerDirectives = (
  {type, properties, keyDirectives, valueDirectives, items}: IMaskerSchema,
  value: any,
  path = '',
  memo: IDirectivesMap = {
    valueDirectives: [],
    keyDirectives: [],
  },
  depth = 0): IDirectivesMap => {

  pushDirective(memo.keyDirectives, path, type, depth, keyDirectives)
  pushDirective(memo.valueDirectives, path, type, depth, valueDirectives)

  if (isObject(properties)) {
    Object.entries(properties as Record<any, any>).forEach(([_k, _v]) => {
      extractMaskerDirectives(_v, value, joinPath(path, _k), memo, depth + 1)
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
          .forEach(_k => extractMaskerDirectives(items as IMaskerSchema, value, joinPath(path, _k), memo, depth + 1))
      }
    }
  }

  if (depth === 0) {
    sortMaskerDirectivesByDepth(memo)
  }

  return memo
}

const compareDepth = (a: IMaskerDirectiveNormalized, b: IMaskerDirectiveNormalized) => b.depth - a.depth

const sortMaskerDirectivesByDepth = (m: IDirectivesMap): void => {
  m.keyDirectives.sort(compareDepth)
  m.valueDirectives.sort(compareDepth)
}

const pushDirective = (memo: IMaskerDirectiveNormalized[], path: string, type: string, depth: number, pipeline?: IMaskerDirective[]): void => {
  if (pipeline?.length) {
    memo.push({pipeline, path, type, depth})
  }
}
