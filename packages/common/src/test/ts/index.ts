import {execute, IMaskerPipeInput} from '../../main/ts'

describe('executor', () => {
  it('processes the pipeline', () => {
    const plain = () => ({value: '***'})
    const double = ({value}: IMaskerPipeInput) => ({value: value.repeat(2)})
    const pipeline = [plain, double]

    const value = 'foobar'
    const result = execute({pipeline, value})

    expect(result).toMatchObject({value: '******'})
  })

  it('delegates control to the pipe', () => {
    const pipe1 = () => ({value: 'pipe1'})
    const pipe2 = ({value, refs, registry, pipeline}: IMaskerPipeInput) =>
      ({value: execute({value, refs, registry, pipeline: pipeline.slice(1)}).value.repeat(2), final: true})
    const pipe3 = () => ({value: 'pipe3'})
    const pipe4 = () => ({value: 'pipe4'})
    const pipeline = [pipe1, pipe2, pipe3, pipe4]

    const value = 'foobar'
    const result = execute({pipeline, value})

    expect(result).toMatchObject({value: 'pipe4pipe4', final: true})
  })

  it('stop propagation once `final` flag occurs', () => {
    const pipe1 = () => ({value: 'pipe1'})
    const pipe2 = () => ({value: 'pipe2'})
    const pipe3 = () => ({value: 'pipe3', final: true})
    const pipe4 = () => ({value: 'pipe4'})
    const pipeline = [pipe1, pipe2, pipe3, pipe4]

    const value = 'foobar'
    const result = execute({pipeline, value})

    expect(result).toMatchObject({value: 'pipe3', final: true})
  })
})

