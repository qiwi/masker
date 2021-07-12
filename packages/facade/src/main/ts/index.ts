import {
  createMasker,
  IMasker,
  IMaskerFactoryOpts,
  IMaskerPipeline,
  IMaskerRegistry,
} from '@qiwi/masker-common'

export * from '@qiwi/masker-common'

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

export const pipeline: IMaskerPipeline = [
  trycatch,
  json,
  secretKey,
  pan,
  split,
]

export const defaultOptions: IMaskerFactoryOpts = {
  registry,
  pipeline,
  unbox: true,
}

export const masker: IMasker = createMasker(defaultOptions)
