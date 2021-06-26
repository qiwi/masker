import {IExecutionMode} from '@qiwi/substrate'
import {
  createPipe as cp,
  execute,
  getPipe,
  mapValues,
  IMaskerPipeInput,
} from '../../main/ts'

describe('#getPipe', () => {
  const registry = new Map()
  const pipe = cp('pipe', () => ({value: 'pipe'}))
  const opts = {}

  registry.set('pipe', pipe)

  const cases: Array<[string, Parameters<typeof getPipe>, any, Error?]> = [
    ['returns fn pipe as is', [pipe, registry], {...pipe, opts: {}}],
    ['finds the pipe by name', ['pipe', registry], {...pipe, opts: {}}],
    ['raises an exception if not found', ['otherpipe', registry], undefined, new Error('Pipe not found: otherpipe')],
    ['supports options notation', [[pipe, opts], registry], {...pipe, opts}],
    ['named ref and options', [['pipe', opts], registry], {...pipe, opts}],
    // @ts-ignore
    ['boxed ref with no options', [['pipe'], registry], {...pipe, opts: {}}],
    // @ts-ignore
    ['undefined if pipe is not a function', [[undefined]], undefined, new Error('Pipe not found: undefined')],
  ]

  cases.forEach(([description, input, output, error]) => {
    it(description, () => {
      if (error) {
        expect(() => getPipe(...input)).toThrow(error)
      }
      else {
        expect(getPipe(...input)).toEqual(output)
      }
    })
  })
})

describe('#execute', () => {
  describe('sync', () => {
    it('processes the pipeline', () => {
      const plain = cp('plain', () => ({value: '***'}))
      const double = cp('double', ({value}: IMaskerPipeInput) => ({value: value.repeat(2)}))
      const pipeline = [plain, double]

      const value = 'foobar'
      const result = execute.sync({pipeline, value})

      expect(result).toMatchObject({value: '******'})
    })

    it('delegates control to the pipe', () => {
      const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
      const pipe2 = cp('pipe2', ({context, pipeline}) =>
        ({
          value: execute.sync({...context, pipeline: pipeline.slice(1)}).value.repeat(2),
          final: true,
        }),
      )
      const pipe3 = cp('pipe3', () => ({value: 'pipe3'}))
      const pipe4 = cp('pipe4', () => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = execute({pipeline, value, mode: IExecutionMode.SYNC})

      expect(result).toMatchObject({value: 'pipe4pipe4', final: true})
    })

    it('stop propagation once `final` flag occurs', () => {
      const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
      const pipe2 = cp('pipe2', () => ({value: 'pipe2'}))
      const pipe3 = cp('pipe3', () => ({value: 'pipe3', final: true}))
      const pipe4 = cp('pipe4', () => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = execute.sync({pipeline, value})

      expect(result).toMatchObject({value: 'pipe3', final: true})
    })
  })

  describe('async', () => {
    it('processes the pipeline', async() => {
      const plain = cp('plain', () => ({value: '***'}))
      const double = cp('double', ({value}: IMaskerPipeInput) => ({value: value.repeat(2)}))
      const pipeline = [plain, double]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: '******'})
    })

    it('delegates control to the pipe', async() => {
      const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
      const pipe2 = cp('pipe2', undefined, async(context) =>
        ({
          value: (await execute({...context, pipeline: context.pipeline.slice(1)})).value.repeat(2),
          final: true,
        }),
      )
      const pipe3 = cp('pipe3', () => ({value: 'pipe3'}))
      const pipe4 = cp('pipe4', () => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: 'pipe4pipe4', final: true})
    })

    it('stop propagation once `final` flag occurs', async() => {
      const pipe1 = cp('pipe1', () => ({value: 'pipe1'}))
      const pipe2 = cp('pipe2', () => ({value: 'pipe2'}))
      const pipe3 = cp('pipe3', () => ({value: 'pipe3', final: true}))
      const pipe4 = cp('pipe4', () => ({value: 'pipe4'}))
      const pipeline = [pipe1, pipe2, pipe3, pipe4]

      const value = 'foobar'
      const result = await execute({pipeline, value})

      expect(result).toMatchObject({value: 'pipe3', final: true})
    })
  })

  describe('behaviour', () => {
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
            e: 'eeee',
          },
        ],
      },
    }
    const expectedValue = {
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

    const striker = cp('striker', ({value}) =>
      (typeof value === 'string'
        ? {value: value.replace(/[^\s]/g, '*')}
        : {value}))
    const splitter = cp('splitter', ({value, execute, context, originPipeline}) =>
      (typeof value === 'object'
        ? ((origin) => {
          const mapped = mapValues(origin, (v) => execute.sync({...context, pipeline: originPipeline, value: v}))
          const value = mapValues(mapped, ({value}) => value)
          const schema = {
            type: 'object',
            properties: mapValues(mapped, ({schema}) => schema),
          }

          return {value, schema}
        })(value)
        : {value}))

    const registry = new Map()
    registry.set(splitter.name, splitter)
    registry.set(striker.name, striker)

    it('masked output inherits proto of input', () => {
      const error = new Error('1000')
      // @ts-ignore
      error.baz = 'quxqux'
      const value = {
        foo: 'bar',
        error,
      }
      const pipeline = [striker, splitter]
      const result = execute.sync({pipeline, value})

      expect(result.value.error).toBeInstanceOf(Error)
      expect(result.value).toMatchObject({
        foo: '***',
        error: {
          message: '****',
          baz: '******',
        },
      })
    })

    it('supports recursive flow', () => {
      const pipeline = [striker, splitter]
      const result = execute.sync({pipeline, value})
      expect(result.value).toEqual(expectedValue)
    })
  })
})
