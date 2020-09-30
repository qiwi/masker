import {IExecutionMode} from '@qiwi/substrate'
import {
  execute as exec,
  createPipe as cp,
  IMaskerSchema,
} from '@qiwi/masker-common'
import {pipe as splitPipe} from '@qiwi/masker-split'
import {
  extractMaskerDirectives,
  withSchema,
} from '../../main/ts'

describe('schema', () => {
  describe('#withSchema', () => {
    it('wraps executor with hoc', () => {
      const execute = withSchema(exec)
      expect(execute).toEqual(expect.any(Function))
    })
  })

  describe('#execute', () => {
    const execute = withSchema(exec)
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
              'valueDirectives': ['striker'],
            },
          },
        },
        'a': {
          'type': 'object',
          'properties': {
            'b': {
              'type': 'object',
              'properties': {
                '0': {
                  'type': 'string',
                  'valueDirectives': ['striker'],
                },
                '1': {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'properties': {
                        'd': {
                          'type': 'string',
                          'valueDirectives': ['striker'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'valueDirectives': ['striker'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const striker = cp('striker', ({value, path}) =>
      (typeof value === 'string' && path !== undefined
        ? {value: value.replace(/[^\s]/g, '*')}
        : {value}))

    const registry = new Map()
    registry.set(splitPipe.name, splitPipe)
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
                'valueDirectives': ['striker'],
              },
            },
          },
          'a': {
            'type': 'object',
            'properties': {
              'b': {
                'type': 'object',
                'properties': [
                  {
                    'type': 'string',
                    'valueDirectives': ['striker'],
                  },
                  {
                    'type': 'object',
                    'properties': {
                      'c': {
                        'type': 'object',
                        'properties': {
                          'd': {
                            'type': 'string',
                            'valueDirectives': ['striker'],
                          },
                        },
                      },
                      'e': {
                        'type': 'string',
                        'valueDirectives': ['striker'],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      }

      // @ts-ignore
      const result = extractMaskerDirectives(schema)

      expect(result).toEqual({
        keyDirectives: [],
        valueDirectives: [
          ['foo.bar', ['striker']],
          ['a.b.0', ['striker']],
          ['a.b.1.c.d', ['striker']],
          ['a.b.1.e', ['striker']],
        ],
      })
    })
  })
})
