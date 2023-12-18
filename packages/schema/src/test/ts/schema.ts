import {IExecutionMode} from '@qiwi/substrate'
import {
  execute as exec,
  createPipe as cp,
  IMaskerPipeInput,
} from '@qiwi/masker-common'
import {pipe as splitPipe} from '@qiwi/masker-split'
import {pipe as panPipe} from '@qiwi/masker-pan'
import {
  extractMaskerDirectives,
  withSchema,
  IMaskerSchema,
} from '../../main/ts'

describe('schema', () => {
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
      foo: {
        bar: '*** *** ***',
      },
      a: {
        b: [
          '** **',
          {
            c: {
              d: '**** **** *',
            },
            e: '****',
          },
        ],
      },
    }
    const expectedSchema: IMaskerSchema = {
      'type': 'object',
      'properties': {
        'foo': {
          'type': 'object',
          'properties': {
            'bar': {
              'type': 'string',
              'maskValue': ['striker'],
            },
          },
        },
        'a': {
          'type': 'object',
          'properties': {
            'b': {
              'type': 'array',
              'items': [
                {
                  'type': 'string',
                  'maskValue': ['striker'],
                },
                {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'properties': {
                        'd': {
                          'type': 'string',
                          'maskValue': ['striker'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'maskValue': ['striker'],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    const striker = cp('striker', ({value, path}: IMaskerPipeInput) =>
      (typeof value === 'string' && path !== undefined
        ? {value: value.replace(/\S/g, '*')}
        : {value}))

    const registry = new Map()
    registry.set(splitPipe.name, splitPipe)
    registry.set(panPipe.name, panPipe)
    registry.set(striker.name, striker)

    it('builds schema while processes the pipeline', () => {
      const pipeline = ['striker', 'split']
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

    it('applies schema `compaction` to array items if possible', async() => {
      const value = {
        pans: ['4111111111111111', '4111111111111111'],
      }
      const pipeline = ['split', 'pan']
      const result = await execute({value, registry, pipeline, mode: IExecutionMode.ASYNC})

      expect(result.schema).toEqual({
        type: 'object',
        properties: {
          pans: {
            type: 'array',
            items: {
              type: 'string',
              maskValue: ['pan'],
            },
          },
        },
      })

      expect(await execute({value, schema: result.schema, registry, pipeline})).toEqual(expect.objectContaining({
        value: {
          pans: ['4111 **** **** 1111', '4111 **** **** 1111'],
        },
      }))
    })
  })

  describe('#extractMaskerDirectives', () => {
    it('returns pairs of paths and directives', () => {
      const schema = {
        'type': 'object',
        'properties': {
          'foo': {
            'type': 'object',
            'properties': {
              'bar': {
                'type': 'string',
                'maskValue': ['striker'],
              },
            },
          },
          'a': {
            'type': 'object',
            'properties': {
              'b': {
                'type': 'array',
                'items': [
                  {
                    'type': 'string',
                    'maskValue': ['striker'],
                  },
                  {
                    'type': 'object',
                    'properties': {
                      'c': {
                        'type': 'object',
                        'properties': {
                          'd': {
                            'type': 'string',
                            'maskValue': ['striker'],
                          },
                        },
                      },
                      'e': {
                        'type': 'string',
                        'maskValue': ['striker'],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = extractMaskerDirectives(schema)

      expect(result).toEqual({
        maskKey: [],
        maskValue: [
          {type: 'string', path: 'a.b.1.c.d', pipeline: ['striker'], depth: 5},
          {type: 'string', path: 'a.b.1.e', pipeline: ['striker'], depth: 4},
          {type: 'string', path: 'a.b.0', pipeline: ['striker'], depth: 3},
          {type: 'string', path: 'foo.bar', pipeline: ['striker'], depth: 2},
        ],
      })
    })
  })
})
