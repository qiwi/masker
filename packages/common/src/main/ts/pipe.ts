import {
  IMaskerPipe,
  IMaskerPipeAsync,
  IMaskerPipeDeclaration,
  IMaskerPipeNormalized,
  IMaskerPipeName,
  IMaskerPipeSync,
  IMaskerRegistry,
} from './interfaces'
import {promisify} from './utils'

export const getPipe = (pipe: IMaskerPipeDeclaration, registry: IMaskerRegistry): IMaskerPipeNormalized => {
  let masker
  let opts

  if (Array.isArray(pipe)) {
    [masker, opts] = pipe
  }
  else {
    masker = pipe
  }

  if (typeof masker === 'string') {
    masker = registry.get(masker)
  }

  if (!masker) {
    throw new Error(`Pipe not found: ${masker || pipe}`)
  }

  return {
    ...masker,
    opts,
  }
}

export const createPipe = (name: IMaskerPipeName, execSync?: IMaskerPipeSync, exec?: IMaskerPipeAsync): IMaskerPipe => {
  const _execSync: IMaskerPipeSync = execSync || (() => ({value: '****** masker not implemented'}))
  const _exec = exec || promisify(_execSync)

  return {
    name,
    execSync: _execSync,
    exec: _exec,
  }
}
