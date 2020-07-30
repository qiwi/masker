import {IExecutionMode} from '@qiwi/substrate'
import {
  execute as exec,
  createPipe as cp,
  mapValues,
  IMaskerSchema,
} from '@qiwi/masker-common'
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
              'maskerDirectives': ['striker'],
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
                  'maskerDirectives': ['striker'],
                },
                {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'properties': {
                        'd': {
                          'type': 'string',
                          'maskerDirectives': ['striker'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'maskerDirectives': ['striker'],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    const striker = cp('striker', ({value}) =>
      (typeof value === 'string'
        ? {value: value.replace(/[^\s]/g, '*')}
        : {value}))
    const splitter = cp('splitter', ({value, execute, context, originPipeline}) =>
      (typeof value === 'object'
        ? ((origin) => {
          const mapped = mapValues(origin, (v) => execute.sync({...context, pipeline: originPipeline, value: v}))
          const value = mapValues(mapped, ({value}) => value)
          const schema = {
            type: 'object',
            properties: mapValues(mapped, ({schema}) => schema),
          }

          return {value, schema}
        })(value)
        : {value}))

    const registry = new Map()
    registry.set(splitter.name, splitter)
    registry.set(striker.name, striker)

    it('builds schema while processes the pipeline', () => {
      const pipeline = ['striker', 'splitter']
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
                'maskerDirectives': ['striker'],
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
                    'maskerDirectives': ['striker'],
                  },
                  {
                    'type': 'object',
                    'properties': {
                      'c': {
                        'type': 'object',
                        'properties': {
                          'd': {
                            'type': 'string',
                            'maskerDirectives': ['striker'],
                          },
                        },
                      },
                      'e': {
                        'type': 'string',
                        'maskerDirectives': ['striker'],
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

      expect(result).toEqual([
        ['foo.bar', ['striker']],
        ['a.b.0', ['striker']],
        ['a.b.1.c.d', ['striker']],
        ['a.b.1.e', ['striker']],
      ])
    })
  })
})
