import {foo, maskerFactory} from '../../main/ts'

describe('',() => {
  it('', () => {
    expect(foo).toBe('bar')
  })
})

describe('maskerFactory', () => {
  it('returns masker', () => {
    const plain = (_target: any) => '***'
    plain.type = 'plain'

    const masker = maskerFactory(plain)
    const target = 'foobar'
    const result = masker(target)

    expect(result).toBe('***')
  })
})
