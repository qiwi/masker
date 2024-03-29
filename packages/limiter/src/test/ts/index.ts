import {createPipe, execute, IMaskerPipeInput, IRawContext, normalizeContext} from '@qiwi/masker-common'
import {name, pipe} from '../../main/ts'

describe('limiter',() => {

  beforeEach(jest.clearAllMocks)

  describe('pipe', () => {
    it('name is defined', () => {
      expect(name).toBe('limiter')
      expect(pipe.name).toBe(name)
    })

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const sleep = (n: number): string => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n)
    const sleepPipe = createPipe('bar', ({value}: IMaskerPipeInput) => {
      sleep(50)
      return {value}
    })
    const barExec = jest.fn(({value = ''}) => ({value: value + 'bar'}))
    const barPipe = createPipe('bar', barExec)

    const cases: [string, IRawContext, string, number][] = [
      [
        'works as regular exec if no opts passed',
        {
          value: 'foo',
          pipeline: [pipe, barPipe, pipe, barPipe, pipe, pipe],
        },
        'foobarbar',
        2,
      ],
      [
        'breaks exec invocations by `limit`',
        {
          value: 'foo',
          pipeline: [[pipe, {limit: 1}], barPipe, barPipe, barPipe],
        },
        '***',
        1,
      ],
      [
        'breaks exec invocations by `duration`',
        {
          value: 'foo',
          pipeline: [[pipe, {duration: 75}], barPipe, sleepPipe, barPipe, sleepPipe, barPipe, barPipe],
        },
        '***',
        2,
      ],
    ]

    cases.forEach(([name, input, result, times]) => {
      const ctx = normalizeContext(input, execute)
      it(name + '(sync)', () => {
        expect(execute({...ctx, sync: true}).value).toBe(result)
        expect(barExec).toHaveBeenCalledTimes(times)
      })

      it(name + '(async)', async() => {
        expect((await execute({...ctx})).value).toBe(result)
        expect(barExec).toHaveBeenCalledTimes(times)
      })
    })
  })
})
