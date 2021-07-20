import {
  IMaskerPipeInput,
  IMaskerPipeName,
  IMaskerPipeNormalized,
  IMaskerPipeOpts,
  IMaskerPipeOutput,
} from '@qiwi/masker-common'

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

export type ISchemaContext = {
  before: IMaskerPipeInput,
  after: IMaskerPipeOutput,
  pipe: IMaskerPipeNormalized
}

export interface IDirectivesMap {
  maskValue: IMaskerDirectiveNormalized[]
  maskKey: IMaskerDirectiveNormalized[]
}

declare module '@qiwi/masker-common/target/es5/interfaces' {
  interface IEnrichedContext {
    schema?: IMaskerSchema
    shortcut?: boolean
  }

  interface IMaskerPipeOutput {
    schema?: IMaskerSchema
    shortcut?: boolean
  }
}
