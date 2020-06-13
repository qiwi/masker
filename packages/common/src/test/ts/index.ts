import {
  execute,
  IMaskerPipeInput,
  getPipe,
  createPipe as cp,
} from '../../main/ts'
import {deepMap} from '../../main/ts/utils'

import {IExecutionMode} from '@qiwi/substrate'

describe('#getPipe', () => {
  const registry = new Map()
  const pipe = cp(() => ({value: 'pipe'}))
  const opts = {}

  registry.set('pipe', pipe)

  const cases: Array<[string, Parameters<typeof getPipe>, ReturnType<typeof getPipe>]> = [
    ['returns fn pipe as is', [pipe], {masker: pipe, opts: undefined}],
    ['finds the pipe by name', ['pipe', registry], {masker: pipe, opts: undefined}],
    ['returns undefined if not found', ['otherpipe', registry], undefined],
    ['returns undefined if registry was not passed', ['pipe'], undefined],
    ['supports options notation', [[pipe, opts]], {masker: pipe, opts}],
    ['named ref and options', [['pipe', opts], registry], {masker: pipe, opts}],
    // @ts-ignore
    ['boxed ref with no options', [['pipe'], registry], {masker: pipe, opts: undefined}],
    // @ts-ignore
    ['undefined if pipe is not a function', [[undefined]], undefined],
  ]

  cases.forEach(([description, input, output]) => {
    it(description, () => {
      expect(getPipe(...input)).toEqual(output)
    })
  })
})

describe('#execute', () => {
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
      const result = execute({pipeline, value, mode: IExecutionMode.SYNC})

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
      const pipe2 = cp(undefined, async(context) =>
        ({
          value: (await execute({...context, pipeline: context.pipeline.slice(1)})).value.repeat(2),
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

  it('supports recursive flow', () => {
    const striper = cp(({value}) =>
      (typeof value === 'string'
        ? {value: value.replace(/[^\s]/g, '*')}
        : {value}))
    const splitter = cp(({value, execute, context, originPipeline}) =>
      (typeof value === 'object' ?
        {value: deepMap(value, (v) => execute.sync({...context, pipeline: originPipeline, value: v}).value)}
        : {value}))
    const pipeline = [striper, splitter]

    const value = {
      foo: {
        bar: 'bar bar bar',
      },
      a: {
        b: [
          'bb bb',
          {
            c: {
              d: 'dddd dddd d',
            },
            e: '****',
          },
        ],
      },
    }
    const expected = {
      foo: {
        bar: '*** *** ***',
      },
      a: {
        b: [
          '** **',
          {
            c: {
              d: '**** **** *',
            },
            e: '****',
          },
        ],
      },
    }
    const result = execute.sync({pipeline, value})
    expect(result).toMatchObject({value: expected})
  })

  // describe('builds scheme while processes the pipeline', () => {})
})
