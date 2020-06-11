import {execute, IMaskerPipeInput, createPipe as cp} from '../../main/ts'

describe('executor', () => {
  describe('sync', () => {
    it('processes the pipeline', () => {
      const plain = cp(() => ({value: '***'}))
      const double = cp(({value}: IMaskerPipeInput) => ({value: value.repeat(2)}))
      const pipeline = [plain, double]

      const value = 'foobar'
      const result = execute.sync({pipeline, value})

      expect(result).toMatchObject({value: '******'})
    })

    it('delegates control to the pipe', () => {
      const pipe1 = cp(() => ({value: 'pipe1'}))
      const pipe2 = cp(({value, refs, registry, pipeline}) =>
        ({
          value: execute.sync({value, refs, registry, pipeline: pipeline.slice(1)}).value.repeat(2),
          final: true,
        }),
      )
      const pipe3 = cp(() => ({value: 'pipe3'}))
      const pipe4 = cp(() => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = execute({pipeline, value, mode: 'sync'})

      expect(result).toMatchObject({value: 'pipe4pipe4', final: true})
    })

    it('stop propagation once `final` flag occurs', () => {
      const pipe1 = cp(() => ({value: 'pipe1'}))
      const pipe2 = cp(() => ({value: 'pipe2'}))
      const pipe3 = cp(() => ({value: 'pipe3', final: true}))
      const pipe4 = cp(() => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = execute.sync({pipeline, value})

      expect(result).toMatchObject({value: 'pipe3', final: true})
    })
  })

  describe('async', () => {
    it('processes the pipeline', async() => {
      const plain = cp(() => ({value: '***'}))
      const double = cp(({value}: IMaskerPipeInput) => ({value: value.repeat(2)}))
      const pipeline = [plain, double]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: '******'})
    })

    it('delegates control to the pipe', async() => {
      const pipe1 = cp(() => ({value: 'pipe1'}))
      const pipe2 = cp(undefined, async({value, refs, registry, pipeline}) =>
        ({
          value: (await execute({value, refs, registry, pipeline: pipeline.slice(1)})).value.repeat(2),
          final: true,
        }),
      )
      const pipe3 = cp(() => ({value: 'pipe3'}))
      const pipe4 = cp(() => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: 'pipe4pipe4', final: true})
    })

    it('stop propagation once `final` flag occurs', async() => {
      const pipe1 = cp(() => ({value: 'pipe1'}))
      const pipe2 = cp(() => ({value: 'pipe2'}))
      const pipe3 = cp(() => ({value: 'pipe3', final: true}))
      const pipe4 = cp(() => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: 'pipe3', final: true})
    })
  })
})
