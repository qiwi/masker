import {createMasker} from '@qiwi/masker-common'
import {pipe as schema} from '@qiwi/masker-schema'
import {pipe as plain} from '@qiwi/masker-plain'
import {pipe as secretKey} from '@qiwi/masker-secret-key'
import {pipe as secretValue} from '@qiwi/masker-secret-value'
import {pipe as split} from '@qiwi/masker-split'
import {pipe as pan} from '@qiwi/masker-pan'
import {pipe as strike} from '@qiwi/masker-strike'

const registry = new Map()
  .set(plain.name, plain)
  .set(secretKey.name, secretKey)
  .set(pan.name, pan)
  .set(strike.name, strike)

const pipeline = [
  secretKey,
  secretValue,
  pan,
  split,
]

describe('schema', () => {
  describe('works as described in README', () => {
    it('example #1', () => {
      const masker = createMasker({
        registry,
        pipeline: [schema, ...pipeline],
      })

      const obj = {
        token: 'foo bar',
        password: 'bazqux',
        details: {
          pans: ['4111111111111111', '1234123412341234'],
          some: 'value',
        },
      }
      const res = masker.sync(obj, {unbox: false})

      expect(res.schema).toEqual({
        type: 'object',
        properties: {
          token: {type: 'string', maskValue: ['plain', 'secret-key']},
          password: {type: 'string', maskValue: ['plain', 'secret-key']},
          details: {
            type: 'object',
            properties: {
              pans: {
                type: 'array',
                items: [{type: 'string', maskValue: ['pan']}, {type: 'string'}],
              }, some: {type: 'string'},
            },
          },
        },
      })

      expect(res.value).toEqual({
        token: '***',
        password: '***',
        details: {
          pans: ['4111 **** **** 1111', '1234123412341234'],
          some: 'value',
        },
      })

      const _res = masker.sync(obj, {unbox: false, schema: res.schema})

      expect(_res.value).toEqual(res.value)
      expect(_res.schema).toBe(res.schema)
    })

    it('example #2', () => {
      const obj = {
        foo: 'foo foo',
        bar: 'bar',
        baz: 'baz',
      }
      const masker = createMasker({
        registry,
        pipeline: [schema, ...pipeline],
      })
      const masked = masker.sync(obj, {
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              maskValue: ['strike'],
            },
          },
        },
      })

      expect(masked).toEqual({
        foo: '*** ***',
        bar: 'bar',
        baz: 'baz',
      })
    })
  })
})
