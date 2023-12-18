import debugFactory, {Debugger} from 'debug'
import {
  IMaskerPipeName,
  createPipe,
  enrichExecutor,
  IEnrichedExecutor,
  IMaskerPipeInput,
  normalizeContext,
  IRawContext,
  SyncGuard,
  patchExecutor,
  IMaskerPipe, hook,
} from '@qiwi/masker-common'



export const name: IMaskerPipeName = 'debug'

const defaultDebugger = debugFactory('masker')

const createDebugger = (scope: string | Debugger = defaultDebugger): Debugger => {
  if (typeof scope === 'string') {
    return debugFactory(scope)
  }

  return scope
}

export const withDebug = ({execute, opts: {debug}}: IMaskerPipeInput): IEnrichedExecutor => {
  const _debugger = createDebugger(debug)
  const log = (label: string, ctx: IMaskerPipe) => {
    _debugger(label, ctx)
    return ctx
  }
  const before = log.bind(null, 'before')
  const after = log.bind(null, 'after')
  const _execute = enrichExecutor(<C extends IRawContext>(cxt: C): SyncGuard<IMaskerPipeInput, C> =>
    hook(hook(hook(normalizeContext(cxt, _execute), before), execute), after))

  return _execute
}

const exec = patchExecutor(withDebug, name)

export const pipe = createPipe(name, exec, exec)

export default pipe

export {type Debugger} from 'debug'