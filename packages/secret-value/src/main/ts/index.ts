import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeline,
  createPipe,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'
import {extractByRegexp} from './extract'
import {createExec} from './inject'

export const name: IMaskerPipeName = 'secret-value'

export interface TSecretDirective {
  pattern: RegExp | string
  pipeline: IMaskerPipeline
}

export const defaultOpts: TSecretDirective = {
  pattern: /(token|pwd|password|credential|secret)?=\s*[^ ]+/i,
  pipeline: [plainPipe],
}

export const exec = createExec(extractByRegexp)

export const pipe: IMaskerPipe = createPipe(name, exec, exec, defaultOpts)

export default pipe
