import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
} from '@qiwi/masker-common'
import luhn from 'fast-luhn'

export const name: IMaskerPipeName = 'pan'

export const pipe: IMaskerPipe = createPipe(name, ({value}) => ({
  value: (typeof value === 'string' || typeof value === 'number')
    ? value.toString().replace(/\d{13,19}/g, v =>
      luhn(v)
        ? `${v.slice(0, 4)} **** **** ${v.slice(-4)}`
        : v)
    : value,
}))

export default pipe
