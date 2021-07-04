import {createPipe, execute, IRawContext, normalizeContext} from '@qiwi/masker-common'
import {name, pipe} from '../../main/ts'

describe('debug',() => {

  beforeEach(jest.clearAllMocks)

  describe('pipe', () => {
    it('name is defined', () => {
      expect(name).toBe('debug')
      expect(pipe.name).toBe(name)
    })

    const debug = jest.fn(() => {/* noop */})
    const successPipe = createPipe('success', () => ({value: 'success'}))
    const cases: [string, IRawContext, string][] = [
      [
        'does now affect the success flow',
        {
          value: 'foo',
          pipeline: [[pipe, {debug}], successPipe],
        },
        'success',
      ],
    ]

    cases.forEach(([name, input, result]) => {
      const ctx = normalizeContext(input, execute)
      it(name + '(sync)', () => {
        expect(execute({...ctx, sync: true}).value).toBe(result)
        expect(debug).toHaveBeenCalledWith('before', expect.objectContaining({value: ctx.value}))
        expect(debug).toHaveBeenCalledWith('before', expect.objectContaining({value: result}))
        expect(debug).toHaveBeenCalledWith('after', expect.objectContaining({value: result}))
        expect(debug).toHaveBeenCalledTimes(4)
      })

      // it(name + '(async)', async() => {
      //   expect((await execute({...ctx})).value).toBe(result)
      // })
    })
  })
})
