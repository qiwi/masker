import {
  IMaskerPipe,
  IMaskerPipeAsync,
  IMaskerPipeDeclaration,
  IMaskerPipelineNormalized,
  IMaskerPipeName,
  IMaskerPipeSync,
  IMaskerRegistry
} from './interfaces'
import {promisify} from './utils'

export const getPipe = (pipe: IMaskerPipeDeclaration, registry?: IMaskerRegistry): IMaskerPipelineNormalized | undefined => {
  let masker
  let opts

  if (Array.isArray(pipe)) {
    [masker, opts] = pipe
  }
  else {
    masker = pipe
  }

  if (typeof masker === 'string') {
    masker = registry
      ? registry.get(masker)
      : undefined
  }

  if (!masker) {
    return undefined
  }

  return {
    masker,
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
