import {IMaskerPipeName, IMaskerPipeOpts} from '@qiwi/masker-common'

export type IMaskerDirective = IMaskerPipeName | [IMaskerPipeName, IMaskerPipeOpts]

export type IMaskerDirectives = Array<IMaskerDirective>

export type IMaskerSchema = {
  type?: any
  valueDirectives?: Array<IMaskerDirective>
  keyDirectives?: Array<IMaskerDirective>
  properties?: Record<string, IMaskerSchema>
  items?: Record<string, IMaskerSchema> | Array<IMaskerSchema>
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
