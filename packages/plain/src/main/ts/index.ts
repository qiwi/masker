import {
  IMaskerPipe,
  IMaskerPipeName,
  createPipe,
} from '@qiwi/masker-common'

export {foo} from '@qiwi/masker-common'

export const name: IMaskerPipeName = 'plain'

export const stub = '***'

export const pipe: IMaskerPipe = createPipe(name, () => ({value: stub}))

export default pipe
