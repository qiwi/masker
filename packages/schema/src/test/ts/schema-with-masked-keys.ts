import {IExecutionMode} from '@qiwi/substrate'
import {execute as exec, IMaskerSchema} from '@qiwi/masker-common'
import {pipe as splitPipe} from '@qiwi/masker-split'
import {pipe as strikePipe} from '@qiwi/masker-strike'
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
          'keyDirectives': ['strike'],
          'properties': {
            'bar': {
              'type': 'string',
              'valueDirectives': ['strike'],
              'keyDirectives': ['strike'],
            },
          },
        },
        'a': {
          'type': 'object',
          'keyDirectives': ['strike'],
          'properties': {
            'b': {
              'keyDirectives': ['strike'],
              'type': 'object',
              'properties': {
                '0': {
                  'type': 'string',
                  'valueDirectives': ['strike'],
                },
                '1': {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'keyDirectives': ['strike'],
                      'properties': {
                        'd': {
                          'type': 'string',
                          'valueDirectives': ['strike'],
                          'keyDirectives': ['strike'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'valueDirectives': ['strike'],
                      'keyDirectives': ['strike'],
                    },
                  },
                },
              },
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
                'valueDirectives': ['strike'],
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
                    'valueDirectives': ['strike'],
                  },
                  {
                    'type': 'object',
                    'properties': {
                      'c': {
                        'type': 'object',
                        'properties': {
                          'd': {
                            'type': 'string',
                            'valueDirectives': ['strike'],
                          },
                        },
                      },
                      'e': {
                        'type': 'string',
                        'valueDirectives': ['strike'],
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
          ['foo.bar', ['strike']],
          ['a.b.0', ['strike']],
          ['a.b.1.c.d', ['strike']],
          ['a.b.1.e', ['strike']],
        ],
      })
    })
  })
})
