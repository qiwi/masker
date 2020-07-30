import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  createPipe,
} from '@qiwi/masker-common'

export const name: IMaskerPipeName = 'strike'

export const stub = '*'

export const pipe: IMaskerPipe = createPipe(name, ({value}: IMaskerPipeInput) => ({
  value: (typeof value === 'string' || typeof value === 'number')
    ? value.toString().replace(/[^\s\r\n\t]/gi, stub)
    : value,
}))

export default pipe
