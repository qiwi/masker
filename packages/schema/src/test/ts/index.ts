import {IExecutionMode} from '@qiwi/substrate'
import {execute} from '@qiwi/masker-common'
import {pipe as split} from '@qiwi/masker-split'
import {pipe as strike} from '@qiwi/masker-strike'
import {
  pipe as schema,
  name,
  IMaskerSchema,
} from '../../main/ts'

describe('schema-index',() => {
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
      }
      const expectedValue = {
        '***': {
          '***': '*** *** ***',
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
                'maskValues': ['strike'],
                'maskKeys': ['strike'],
              },
            },
            'maskKeys': ['strike'],
          },
        },
      }

      const registry = new Map()
      registry.set(schema.name, schema)
      registry.set(split.name, split)
      registry.set(strike.name, strike)

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
