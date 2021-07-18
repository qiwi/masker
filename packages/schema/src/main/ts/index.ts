import {
  normalizeContext,
  hook,
  enrichExecutor,
  IMaskerPipeName,
  IEnrichedContext,
  IEnrichedExecutor,
  IMaskerPipeOutput,
  IRawContext,
  patchExecutor,
  createPipe,
  TExecutorHook,
} from '@qiwi/masker-common'

import {shortCutExecute} from './shortcut'
import {generateSchema} from './generate'

export * from './generate'
export * from './interfaces'
export * from './shortcut'

export const name: IMaskerPipeName = 'schema'

export const withSchema: TExecutorHook = ({execute}): IEnrichedExecutor => {
  const _execute = enrichExecutor((context: IRawContext) => {
    const sharedContext: IEnrichedContext = normalizeContext(context, _execute)
    const {schema, pipe} = sharedContext

    if (schema && !sharedContext.shortcut) {
      sharedContext.shortcut = true
      return shortCutExecute(sharedContext)
    }

    if (!pipe) {
      return context
    }

    const appendSchema = (res: IMaskerPipeOutput): IMaskerPipeOutput => ({
      ...res,
      schema: generateSchema({before: sharedContext, after: {...res, value: res._value ?? res.value}, pipe}),
    })

    return hook(execute(sharedContext), sharedContext.shortcut ? v => v : appendSchema)
  })

  return _execute
}

const exec = patchExecutor(withSchema, name)

export const pipe = createPipe(name, exec, exec)

export default pipe
