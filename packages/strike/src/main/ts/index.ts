import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  createPipe,
} from '@qiwi/masker-common'

export const name: IMaskerPipeName = 'strike'

export const stub = '*'

export const pipe: IMaskerPipe = createPipe(name, ({value}: IMaskerPipeInput) => ({value: ('' + value).replace(/[^\s\r\n\t]/gi, stub)}))

export default pipe
