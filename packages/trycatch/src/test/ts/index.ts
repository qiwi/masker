import {createPipe, execute, IRawContext, normalizeContext} from '@qiwi/masker-common'
import {name, pipe} from '../../main/ts'

describe('trycatch',() => {

  beforeEach(jest.clearAllMocks)

  describe('pipe', () => {
    it('name is defined', () => {
      expect(name).toBe('trycatch')
      expect(pipe.name).toBe(name)
    })

    const successPipe = createPipe('bar', () => ({value: 'success'}))
    const errorPipe = createPipe('bar', () => {
      throw new Error('Error')
    })

    const cases: [string, IRawContext, string][] = [
      [
        'does now affect the success flow',
        {
          value: 'foo',
          pipeline: [pipe, successPipe],
        },
        'success',
      ],
      [
        'captures errors, applies the fallback pipeline',
        {
          value: 'foo',
          pipeline: [pipe, successPipe, errorPipe],
        },
        '***',
      ],
    ]

    cases.forEach(([name, input, result]) => {
      const ctx = normalizeContext(input, execute)
      it(name + '(sync)', () => {
        expect(execute({...ctx, sync: true}).value).toBe(result)
      })

      it(name + '(async)', async() => {
        expect((await execute({...ctx})).value).toBe(result)
      })
    })
  })
})
