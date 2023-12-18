import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe, IMaskerPipeInput,
} from '@qiwi/masker-common'
import luhn from 'fast-luhn'

export const name: IMaskerPipeName = 'pan'

export const pipe: IMaskerPipe = createPipe(name, ({value}: IMaskerPipeInput) => ({
  value: (typeof value === 'string' || typeof value === 'number' || value instanceof String || value instanceof Number)
    ? value.toString().replace(/\d{13,19}|(\d{4}[\s-]+){3}\d{4}([\s-]*\d{3})?/g, v => {
      const _v = v.replace(/\D/g, '')
      return luhn(_v)
        ? `${_v.slice(0, 4)} **** **** ${_v.slice(-4)}`
        : v
    })
    : value,
}))

export default pipe
