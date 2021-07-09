import {createMasker, registry, pipeline, masker} from '../../main/ts'

describe('facade',() => {
  it('export', () => {
    expect(pipeline).toEqual(expect.any(Array))
    expect(registry).toEqual(expect.any(Map))
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
      }
      const result = {
        token: '***',
        password: '***',
        details: {
          pans: ['4111 **** **** 1111', '1234123412341234'],
          some: 'value',
        },
      }

      expect(masker.sync(value)).toEqual(result)
      expect(await masker(value)).toEqual(result)
    })
  })

  describe('createMasker()', () => {
    it('if no arg passed, returns a new masker instance with default options', () => {
      expect(createMasker().sync('4111111111111111')).toBe('4111 **** **** 1111')
    })

    it('it applies a custom pipeline if passed', () => {
      expect(createMasker({
        pipeline: [
          'split',
          ['secret-key', {
            pattern: 'b.*r',
            pipeline: ['strike'],
          }],
          ['secret-value', {
            pattern: 'quux',
            pipeline: ['plain'],
          }],
        ]})
        .sync({fooo: {baar: 'bar baz', arr: ['qux', 'quux']}}))
        .toEqual({fooo: {baar: '*** ***', arr: ['qux', '***']}})
    })
  })
})
