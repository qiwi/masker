import {
  execute,
  IMaskerSchema,
} from '@qiwi/masker-common'
import {pipe as split} from '@qiwi/masker-split'
import {pipe as strike} from '@qiwi/masker-strike'
import {
  pipe as schema,
  name,
} from '../../main/ts'
import {IExecutionMode} from '@qiwi/substrate'

describe('schema',() => {
  describe('pipe', () => {
    it('name is defined', () => {
      expect(name).toBe('schema')
      expect(schema.name).toBe(name)
    })

    describe('executor', () => {
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
                'maskerDirectives': ['strike'],
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
                    'maskerDirectives': ['strike'],
                  },
                  {
                    'type': 'object',
                    'properties': {
                      'c': {
                        'type': 'object',
                        'properties': {
                          'd': {
                            'type': 'string',
                            'maskerDirectives': ['strike'],
                          },
                        },
                      },
                      'e': {
                        'type': 'string',
                        'maskerDirectives': ['strike'],
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
      registry.set(split.name, split)
      registry.set(strike.name, strike)
      registry.set(schema.name, schema)

      it('builds schema while processes the pipeline', () => {
        const pipeline = ['schema', 'split', 'strike']
        const result = execute.sync({pipeline, value, registry})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toEqual(expectedSchema)
      })

      it('uses context.schema if passed', () => {
        const result = execute.sync({schema: expectedSchema, value, registry, pipeline: ['schema']})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toBe(expectedSchema)
      })

      it('uses context.schema if passed (async)', async() => {
        const result = await execute({schema: expectedSchema, value, registry, mode: IExecutionMode.ASYNC, pipeline: ['schema']})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toBe(expectedSchema)
      })
    })
  })
})
