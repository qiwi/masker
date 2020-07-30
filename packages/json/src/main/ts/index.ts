import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  createPipe,
} from '@qiwi/masker-common'

import {extractJsonStrings} from './extract'

export const name: IMaskerPipeName = 'json'

export const pipe: IMaskerPipe = createPipe(name, ({value}: IMaskerPipeInput) => ({
  value: (typeof value === 'string')
    ? extractJsonStrings(value)
    : value,
}))

export default pipe
