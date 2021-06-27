import {createPipe, execute, IMaskerPipeOutput, normalizeContext} from '@qiwi/masker-common'
import {name, pipe} from '../../main/ts'
import {IExecutionMode} from "@qiwi/substrate-types";

describe('limiter',() => {
  beforeEach(jest.clearAllMocks)
  describe('pipe', () => {
    it('name is defined', () => {
      expect(name).toBe('limiter')
      expect(pipe.name).toBe(name)
    })

    const barExec = jest.fn(({value = ''}) => ({value: value + 'bar'}))
    const barPipe = createPipe('bar', barExec)

    // it('breaks exec invocations by `duration`', () => {
    //
    // })
    it('works as regular exec if no opts passed', () => {
      const value = 'foo'
      const input = normalizeContext({
        mode: IExecutionMode.SYNC,
        value,
        pipeline: [pipe, barPipe, pipe, barPipe, pipe, pipe],
      }, execute)

      expect((execute(input) as IMaskerPipeOutput).value).toBe('foobarbar')
      expect(barExec).toHaveBeenCalledTimes(2)
    })

    it('breaks exec invocations by `limit`', () => {
      const value = 'foo'
      const opts = {limit: 1}
      const input = normalizeContext({
        mode: IExecutionMode.SYNC,
        value,
        pipeline: [[pipe, opts], barPipe, barPipe, barPipe],
      }, execute)

      expect((execute(input) as IMaskerPipeOutput).value).toBe('***')
      expect(barExec).toHaveBeenCalledTimes(1)
    })

    /*describe('replaces any value with stub', () => {
      const cases = [
        ['foo', stub],
        [null, stub],
        [{}, stub],
      ]
      cases.forEach(([value, expected]) => {
        const result = {value: expected}
        const input = normalizeContext({value}, execute)

        it(`${value} > ${expected}`, async() => {
          expect(pipe.execSync(input)).toEqual(result)
          expect(await pipe.exec(input)).toEqual(result)
        })
      })
    })*/
  })
})
