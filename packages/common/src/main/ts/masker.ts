import {execute} from './execute'
import {
  IMasker,
  IMaskerFactoryOpts,
  IMaskerOpts,
  IRawContext,
} from './interfaces'
import {hook, unboxValue} from './utils'

export const createMasker = (_opts: IMaskerFactoryOpts = {}): IMasker => {
  const _execute = (ctx: IMaskerOpts) =>
    // NOTE unbox is enabled by default
    hook(execute(ctx), (ctx.unbox ?? _opts.unbox) === false ? v => v : unboxValue)

  const masker = (value: any, opts: IRawContext = {}): Promise<any> => _execute({..._opts, ...opts, value})
  masker.sync = (value: any, opts: IRawContext = {}): any => _execute({..._opts, ...opts, value, sync: true})

  return masker
}
