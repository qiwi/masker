import {createMasker, createPipe} from '../../main/ts'

describe('createMasker()', () => {
  const fooPipe = createPipe('foo', () => ({value: 'foo'}))
  const barPipe = createPipe('bar', () => ({value: 'bar'}))

  it('returns new masker instance', async() => {
    expect(createMasker().sync('value')).toBe('value')
    expect(await createMasker()('value')).toBe('value')
  })

  it('unbox === false, masker returns raw pipe output', () => {
    expect(createMasker({unbox: false}).sync('value')).toEqual(expect.objectContaining({value: 'value'}))
  })

  it('applies defaults opts if passed to factory', () => {
    expect(createMasker({
      pipeline: [fooPipe],
    }).sync('value')).toBe('foo')
  })

  it('custom opts override defaults', () => {
    expect(createMasker({
      pipeline: [fooPipe],
    })
      .sync('value', {pipeline: [barPipe]}))
      .toEqual('bar')
  })
})
