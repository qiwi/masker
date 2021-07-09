import {
  execute,
  IMaskerPipeline,
  IMaskerRegistry,
} from '@qiwi/masker-common'

import {pipe as dbg} from '@qiwi/masker-debug'
import {pipe as json} from '@qiwi/masker-json'
import {pipe as limiter} from '@qiwi/masker-limiter'
import {pipe as pan} from '@qiwi/masker-pan'
import {pipe as plain} from '@qiwi/masker-plain'
import {pipe as schema} from '@qiwi/masker-schema'
import {pipe as secretKey} from '@qiwi/masker-secret-key'
import {pipe as secretValue} from '@qiwi/masker-secret-value'
import {pipe as split} from '@qiwi/masker-split'
import {pipe as strike} from '@qiwi/masker-strike'
import {pipe as trycatch} from '@qiwi/masker-trycatch'

export const registry: IMaskerRegistry = new Map()
  .set(dbg.name, dbg)
  .set(json.name, json)
  .set(limiter.name, limiter)
  .set(pan.name, pan)
  .set(plain.name, plain)
  .set(schema.name, schema)
  .set(secretKey.name, secretKey)
  .set(secretValue.name, secretValue)
  .set(split.name, split)
  .set(strike.name, strike)
  .set(trycatch.name, trycatch)

export const pipeline = [
  trycatch,
  json,
  secretKey,
  pan,
  split,
]

export interface IMaskerFactoryOpts {
  pipeline?: IMaskerPipeline,
  registry?: IMaskerRegistry
}

export const defaultOptions: IMaskerFactoryOpts = {
  registry,
  pipeline,
}

export type IMasker = {
  (value: any): Promise<any>
  sync(value: any): any
}

export const createMasker = (opts: IMaskerFactoryOpts = {}): IMasker => {
  const _opts = {...defaultOptions, ...opts}
  const masker = (value: any): Promise<any> => execute({..._opts, value}).then(({value}) => value)

  masker.sync = (value: any): any => execute({..._opts, value, sync: true}).value

  return masker
}

export const masker: IMasker = createMasker()
