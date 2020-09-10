import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  createPipe,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const pattern = /token|password|credential|sensor|private/i

export const name: IMaskerPipeName = 'sensor'

export const pipe: IMaskerPipe = createPipe(name, ({value, path, context, execute}: IMaskerPipeInput) =>
  typeof path === 'string' && pattern.test(path)
    ? execute.sync({...context, pipeline: [plainPipe]})
    : {value},
)

export default pipe
