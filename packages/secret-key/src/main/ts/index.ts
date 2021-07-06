import {
  IMaskerPipe,
  IMaskerPipeName,
  IMaskerPipeline,
  createPipe,
  SyncGuard,
  IEnrichedContext,
  IMaskerPipeOutput,
  asRegExp,
  execEcho,
} from '@qiwi/masker-common'

import {pipe as plainPipe} from '@qiwi/masker-plain'

export const name: IMaskerPipeName = 'secret-key'

export interface TSecretDirective {
  pattern: RegExp | string
  pipeline: IMaskerPipeline
}

export const defaultOpts: TSecretDirective = {
  pattern: /token|password|credential|secret|private/i,
  pipeline: [plainPipe],
}

export const exec = <C extends IEnrichedContext>({path, context, execute, opts: {pipeline, pattern}}: C): SyncGuard<IMaskerPipeOutput, C> =>
  ((asRegExp(pattern) as RegExp).test(path)
    ? execute({...context, pipeline})
    : execEcho(context)
  ) as SyncGuard<IMaskerPipeOutput, C>

export const pipe: IMaskerPipe = createPipe(name, exec, exec, defaultOpts)

export default pipe
