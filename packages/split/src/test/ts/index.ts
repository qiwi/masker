// mport {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  name,
} from '../../main/ts'

describe('split',() => {
  it('name is defined', () => {
    expect(name).toBe('split')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('blank test', () => {
      expect(true).toBeTruthy()
    })
  })
})
