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
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'limiter'

export const withLimiter = ({execute, opts: {pipeline, limit, duration}}: IMaskerPipeInput): IEnrichedExecutor => {
  const _pipeline = pipeline || [plainPipe]
  const _endsAt = duration ? Date.now() + duration : Number.POSITIVE_INFINITY
  let _limit = limit === undefined ? Number.POSITIVE_INFINITY : limit | 0

  const _execute = enrichExecutor(<C extends IRawContext>(cxt: C): SyncGuard<IMaskerPipeInput, C> => {
    const _cxt: IEnrichedContext = normalizeContext(cxt, _execute)
    if (Date.now() >= _endsAt || _limit-- <= 0) {
      return execute({..._cxt, execute, pipeline: _pipeline}) as SyncGuard<IMaskerPipeInput, C>
    }

    return execute(_cxt) as SyncGuard<IMaskerPipeInput, C>
  })

  return _execute
}

const exec = patchExecutor(withLimiter, name)

export const pipe = createPipe(name, exec, exec)

export default pipe
