import {extractMaskerDirectives} from '../../main/ts/schema'
// import {IMaskerSchema} from "../../main/ts/interfaces";

describe('schema', () => {
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
