import {
  IMaskerPipeName,
  createPipe,
  enrichExecutor,
  IEnrichedExecutor,
  IMaskerPipeInput,
  IExecutorSync,
  IEnrichedContext,
  normalizeContext,
  IRawContext, SyncGuard,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'limiter'

export const withLimiter = ({execute, opts: {pipeline, limit, duration}}: IMaskerPipeInput): IEnrichedExecutor => {
  const _pipeline = pipeline || [plainPipe]
  const _endsAt = duration ? Date.now() + duration : Number.POSITIVE_INFINITY
  let _limit = limit !== undefined ? limit | 0 : Number.POSITIVE_INFINITY

  const _execute = enrichExecutor(<C extends IRawContext>(cxt: C): SyncGuard<IMaskerPipeInput, C> => {
    const _cxt: IEnrichedContext = normalizeContext(cxt, _execute)
    if (Date.now() >= _endsAt || _limit-- <= 0) {
      return execute({..._cxt, execute, pipeline: _pipeline}) as SyncGuard<IMaskerPipeInput, C>
    }

    return execute(_cxt) as SyncGuard<IMaskerPipeInput, C>
  })

  return _execute
}

const exec = <C extends IMaskerPipeInput>(ctx: C): SyncGuard<IMaskerPipeInput, C> => {
  ctx.execute = withLimiter(ctx)
  ctx.originPipeline = ctx.originPipeline.filter((pipe) => pipe.name !== name)
  ctx.pipeline = ctx.pipeline.filter((pipe) => pipe.name !== name)

  // @ts-ignore
  ctx.context = ctx.parent = undefined

  return ctx.execute(ctx) as SyncGuard<IMaskerPipeInput, C>
}

export const pipe = createPipe(name, exec as IExecutorSync)

export default pipe
