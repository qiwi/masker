import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeInput,
  IMaskerPipeline,
  IMaskerOpts,
  createPipe,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const defaultPattern = /token|password|credential|secret|private/i
export const defaultPipeline = [plainPipe]

export const name: IMaskerPipeName = 'sensor'

export type TSensorDirective = {
  pattern: RegExp
  pipeline: IMaskerPipeline
}

export type TSensorDirectives = Array<TSensorDirective>

export const getDirectives = ({pattern, pipeline, directives}: IMaskerOpts): TSensorDirectives => {
  if (Array.isArray(directives)) {
    return directives
  }

  const _pipeline = pipeline || defaultPipeline
  const _pattern = pattern instanceof RegExp
    ? pattern
    : typeof pattern === 'string'
      ? new RegExp(pattern, 'i')
      : defaultPattern

  return [{
    pattern: _pattern,
    pipeline: _pipeline,
  }]
}

export const getPipeline = (path: string, opts: IMaskerOpts): IMaskerPipeline | undefined =>
  getDirectives(opts).find(({pattern}) => pattern.test(path))?.pipeline

export const pipe: IMaskerPipe = createPipe(name, ({value, path, context, execute, opts}: IMaskerPipeInput) => {
  if (typeof path === 'string') {
    const pipeline = getPipeline(path, opts)

    if (pipeline) {
      return execute.sync({...context, pipeline})
    }
  }

  return {value}
})

export default pipe
