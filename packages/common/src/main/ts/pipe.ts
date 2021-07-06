import {
  IMaskerPipe,
  IMaskerPipeAsync,
  IMaskerPipeDeclaration,
  IMaskerPipeNormalized,
  IMaskerPipeName,
  IMaskerPipeSync,
  IMaskerRegistry, IMaskerPipeDual, IMaskerOpts,
} from './interfaces'
import {asynchronize} from './utils'

export const getPipe = (pipe: IMaskerPipeDeclaration, registry: IMaskerRegistry): IMaskerPipeNormalized => {
  let masker
  let opts
  let maskerName

  if (Array.isArray(pipe)) {
    [masker, opts] = pipe
  }
  else {
    masker = pipe
  }

  if (typeof masker === 'string') {
    maskerName = masker
    masker = registry.get(masker)
  }

  if (!masker) {
    throw new Error(`Pipe not found: ${maskerName || masker}`)
  }

  return {
    ...masker,
    opts: {...masker.opts, ...opts},
  }
}

export const createPipe = (name: IMaskerPipeName, execSync: IMaskerPipeSync | IMaskerPipeDual, exec?: IMaskerPipeAsync | IMaskerPipeDual, opts: IMaskerOpts = {}): IMaskerPipe =>
  ({
    name,
    execSync,
    exec: exec || asynchronize(execSync),
    opts,
  })
