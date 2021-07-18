import {IExecutionMode} from '@qiwi/substrate'
import {execute as exec, IMaskerPipeInput} from '@qiwi/masker-common'
import {pipe as splitPipe} from '@qiwi/masker-split'
import {pipe as strikePipe} from '@qiwi/masker-strike'

import {withSchema, IMaskerSchema} from '../../main/ts'

describe('schema-with-masked-keys', () => {
  describe('#withSchema', () => {
    it('wraps executor with hoc', () => {
      const execute = withSchema({execute: exec} as IMaskerPipeInput)
      expect(execute).toEqual(expect.any(Function))
    })
  })

  describe('#execute', () => {
    const execute = withSchema({execute: exec} as IMaskerPipeInput)
    const value = {
      foo: {
        bar: 'bar bar bar',
      },
      a: {
        b: [
          'bb bb',
          {
            c: {
              d: 'dddd dddd d',
            },
            e: 'eeee',
          },
        ],
      },
    }
    const expectedValue = {
      '***': {
        '***': '*** *** ***',
      },
      '*': {
        '*': [
          '** **',
          {
            '*': {
              '*': '**** **** *',
            },
            '*(2)': '****',
          },
        ],
      },
    }
    const expectedSchema: IMaskerSchema = {
      'type': 'object',
      'properties': {
        'foo': {
          'type': 'object',
          'maskKeys': ['strike'],
          'properties': {
            'bar': {
              'type': 'string',
              'maskValues': ['strike'],
              'maskKeys': ['strike'],
            },
          },
        },
        'a': {
          'type': 'object',
          'maskKeys': ['strike'],
          'properties': {
            'b': {
              'type': 'array',
              'maskKeys': ['strike'],
              'items': [
                {
                  'type': 'string',
                  'maskValues': ['strike'],
                },
                {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'maskKeys': ['strike'],
                      'properties': {
                        'd': {
                          'type': 'string',
                          'maskValues': ['strike'],
                          'maskKeys': ['strike'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'maskValues': ['strike'],
                      'maskKeys': ['strike'],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    const registry = new Map()
    registry.set(splitPipe.name, splitPipe)
    registry.set(strikePipe.name, strikePipe)

    it('builds schema while processes the pipeline', () => {
      const pipeline = ['strike', 'split']
      const result = execute.sync({pipeline, value, registry})

      expect(result.value).toEqual(expectedValue)
      expect(result.schema).toEqual(expectedSchema)
    })

    it('uses context.schema if passed', () => {
      const result = execute.sync({schema: expectedSchema, value, registry})

      expect(result.value).toEqual(expectedValue)
      expect(result.schema).toBe(expectedSchema)
    })

    it('uses context.schema if passed (async)', async() => {
      const result = await execute({schema: expectedSchema, value, registry, mode: IExecutionMode.ASYNC})

      expect(result.value).toEqual(expectedValue)
      expect(result.schema).toBe(expectedSchema)
    })
  })
})
