import {
  IMaskerPipeName,
  createPipe,
  enrichExecutor,
  IEnrichedExecutor,
  IMaskerPipeInput,
  IExecutorSync,
  IEnrichedContext,
  normalizeContext,
  IRawContext,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'limiter'

export const withLimiter = ({execute, opts: {pipeline, limit, duration}}: IMaskerPipeInput): IEnrichedExecutor => {
  const _pipeline = pipeline || [plainPipe]
  const _endsAt = duration ? Date.now() + duration : Number.POSITIVE_INFINITY
  let _limit = limit !== undefined ? limit | 0 : Number.POSITIVE_INFINITY

  const _execute = enrichExecutor((cxt: IRawContext) => {
    const _cxt: IEnrichedContext = normalizeContext(cxt, _execute)
    if (Date.now() >= _endsAt || _limit-- <= 0) {
      return execute({..._cxt, execute, pipeline: _pipeline})
    }

    return execute(_cxt)
  })

  return _execute
}

const exec = ((ctx: IMaskerPipeInput) => {
  ctx.execute = withLimiter(ctx)
  ctx.originPipeline = ctx.originPipeline.filter((pipe) => pipe.name !== name)
  ctx.pipeline = ctx.pipeline.filter((pipe) => pipe.name !== name)

  // @ts-ignore
  ctx.context = ctx.parent = undefined

  return ctx.execute(ctx)
}) as IExecutorSync

export const pipe = createPipe(name, exec)

export default pipe
