import {
  IMaskerPipeAsync,
  IMaskerPipeDeclaration,
  IMaskerPipeNormalized,
  IMaskerPipeName,
  IMaskerPipeSync,
  IMaskerRegistry,
  IMaskerPipeDual,
  IMaskerOpts,
} from './interfaces'
import {asynchronize} from './utils'

export const getPipe = (pipe: IMaskerPipeDeclaration, registry: IMaskerRegistry): IMaskerPipeNormalized => {
  let _pipe
  let opts
  let maskerName

  if (Array.isArray(pipe)) {
    [_pipe, opts] = pipe
  }
  else {
    _pipe = pipe
  }

  if (typeof _pipe === 'string') {
    maskerName = _pipe
    _pipe = registry.get(_pipe)
  }

  if (!_pipe) {
    throw new Error(`Pipe not found: ${maskerName || _pipe}`)
  }

  return {
    ..._pipe,
    opts: {..._pipe.opts, ...opts},
  }
}

export const createPipe = (name: IMaskerPipeName, execSync: IMaskerPipeSync | IMaskerPipeDual, exec?: IMaskerPipeAsync | IMaskerPipeDual, opts: IMaskerOpts = {}): IMaskerPipeNormalized =>
  ({
    name,
    execSync,
    exec: exec || asynchronize(execSync),
    opts,
  })
