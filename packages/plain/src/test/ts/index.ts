import {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  stub,
  name,
} from '../../main/ts'

describe('plain',() => {
  it('stub equals `***`', () => {
    expect(stub).toBe('***')
  })

  it('name is defined', () => {
    expect(name).toBe('plain')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('replaces any value with stub', () => {
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
    })
  })
})
