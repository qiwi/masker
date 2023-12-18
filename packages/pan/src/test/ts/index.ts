import {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  name,
} from '../../main/ts'

describe('pan',() => {
  it('name is defined', () => {
    expect(name).toBe('pan')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces any value with stub', () => {
      const cases = [
        ['4324246524356541 45534234561 342gfdgdg', '4324246524356541 45534234561 342gfdgdg'],
        [
          '4324246524356541 4111111111111111 342gfdgdg 4111111111111111   ',
          '4324246524356541 4111 **** **** 1111 342gfdgdg 4111 **** **** 1111   ',
        ],
        [4_111_111_111_111_111, '4111 **** **** 1111'],
        [Number(4_111_111_111_111_111), '4111 **** **** 1111'],
        ['4111111111111111', '4111 **** **** 1111'],
        [String('4111111111111111'), '4111 **** **** 1111'],
        ['4111 1111 1111 1111', '4111 **** **** 1111'],
        ['4111-1111-1111-1111', '4111 **** **** 1111'],
        [{}, {}],
      ]
      cases.forEach(([value, expected]) => {
        const result = {value: expected}
        const input = normalizeContext({value}, execute)

        it(`${value} (${typeof value})> ${expected}`, async() => {
          expect(pipe.execSync(input)).toEqual(result)
          expect(await pipe.exec(input)).toEqual(result)
        })
      })
    })
  })
})
