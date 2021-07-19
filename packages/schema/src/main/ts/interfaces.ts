import {IMaskerPipeName, IMaskerPipeOpts} from '@qiwi/masker-common'

export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerPipeOpts]

export type IMaskerDirectives = Array<IMaskerDirective>

export interface IMaskerSchema {
  type?: any
  maskValue?: Array<IMaskerDirective>
  maskKey?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema>
  items?: Record<string, IMaskerSchema> | Array<IMaskerSchema>
}

export interface IMaskerDirectiveNormalized {
  path: string
  pipeline: IMaskerDirectives
  type: string
  depth: number
}

export interface IDirectivesMap {
  maskValue: IMaskerDirectiveNormalized[]
  maskKey: IMaskerDirectiveNormalized[]
}

declare module '@qiwi/masker-common' {
  interface IEnrichedContext {
    schema?: IMaskerSchema
    shortcut?: boolean
  }

  interface IMaskerPipeOutput {
    schema?: IMaskerSchema
    shortcut?: boolean
  }
}
