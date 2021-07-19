import {registry, pipeline, masker} from '../../main/ts'

describe('facade',() => {
  it('export', () => {
    expect(pipeline).toEqual(expect.any(Array))
    expect(registry).toEqual(expect.any(Map))
  })

  describe('readme', () => {
    it('example #1 (root)', () => {
      const res = masker.sync({
        secret: 'foo',
        nested: {pans: [4111111111111111]},
        foo: 'str with printed password=foo and smth else',
        json: 'str with json inside {"secret":"bar"} {"4111111111111111":"bar"}',
      }, {
        registry, // stores the plugins
        pipeline: [
          'split',          // to recursivly process target object's childen. The same `pipeline` will be applied to internal keys and values
          'pan',            // to mask card PANs
          'secret-key',     // to conceal the values of sectitily named field like `secret` or `token` (pattern is configurable)
          'secret-value',   // to replace sensitive parts of strings (pattern is configurable)
          'json',           // to find jsons in strings
        ],
      })

      expect(res).toEqual({
        secret: '***',
        nested: {pans: [ '4111 **** **** 1111' ]},
        foo: 'str with printed *** and smth else',
        json: 'str with json inside {"secret":"***"} {"4111 **** **** 1111":"bar"}'
      })
    })

    it('example #2 (root)', () => {
      const res = masker.sync({
        fo: 'fo',
        foo: 'bar',
        foofoo: 'barbar',
        baz: 'qux',
        arr:  [4111111111111111, 1234123412341234],
      }, {
        pipeline: ['schema'],
        schema: {
          type: 'object',
          properties: {
            fo: {
              type: 'string',
              maskKeys: ['plain'],
            },
            foo: {
              type: 'string',
              maskKeys: ['plain'],
            },
            foofoo: {
              type: 'string',
              maskKeys: ['strike'],
              maskValues: ['plain'],
            },
            arr: {
              type: 'array',
              items: {
                type: 'number',
                maskValues: ['pan'],
              },
            },
          },
        },
      })

      expect(res).toEqual({
        baz: 'qux',
        arr: [ '4111 **** **** 1111', '1234123412341234' ],
        '***': 'fo',
        '***(2)': 'bar',
        '******': '***',
      })
    })
  })

  describe('masker', () => {
    it('provides both sync and async flows', async() => {
      const value = {
        token: 'foo bar',
        password: 'bazqux',
        details: {
          pans: ['4111111111111111', '1234123412341234'],
          some: 'value',
        },
        text: 'foo bar password=value baz',
      }
      const result = {
        token: '***',
        password: '***',
        details: {
          pans: ['4111 **** **** 1111', '1234123412341234'],
          some: 'value',
        },
        text: 'foo bar *** baz',
      }

      expect(masker.sync(value)).toEqual(result)
      expect(await masker(value)).toEqual(result)
    })

    it('handles `unbox` flag', async() => {
      const value = '4111 1111 1111 1111'
      const result = '4111 **** **** 1111'

      expect(await masker(value, {unbox: false})).toEqual(expect.objectContaining({value: result}))
      expect(masker.sync(value, {unbox: false})).toEqual(expect.objectContaining({value: result}))
    })
  })
})
