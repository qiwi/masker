import {
  IMaskerPipeName,
  createPipe,
  enrichExecutor,
  IEnrichedExecutor,
  IMaskerPipeInput,
  IEnrichedContext,
  normalizeContext,
  IRawContext,
  SyncGuard,
  patchExecutor,
  isPromiseLike,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'trycatch'

export const withTrycatch = ({execute, opts: {pipeline}}: IMaskerPipeInput): IEnrichedExecutor => {
  const _pipeline = pipeline || [plainPipe]
  const _execute = enrichExecutor(<C extends IRawContext>(cxt: C): SyncGuard<IMaskerPipeInput, C> => {
    const _cxt: IEnrichedContext = normalizeContext(cxt, _execute)
    const fallback = () => execute({..._cxt, execute, pipeline: _pipeline}) as SyncGuard<IMaskerPipeInput, C>
    try {
      const res = execute(_cxt)
      return (isPromiseLike(res)
        ? res.catch(fallback)
        : res) as SyncGuard<IMaskerPipeInput, C>
    }
    catch {
      return fallback()
    }
  })

  return _execute
}

const exec = patchExecutor(withTrycatch, name)

export const pipe = createPipe(name, exec, exec)

export default pipe
