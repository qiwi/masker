import {
  createPipe,
  IMaskerPipe,
  IMaskerPipeName,
} from '@qiwi/masker-common'

import {extractJsonEntries} from './extract'
import {createExec, defaultOpts} from '@qiwi/masker-secret-value'

export * from './extract'

export const name: IMaskerPipeName = 'json'

export const exec = createExec(extractJsonEntries)

export const pipe: IMaskerPipe = createPipe(name, exec, exec, defaultOpts)

export default pipe
