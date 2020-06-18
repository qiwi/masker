import {IExecutionMode} from '@qiwi/substrate'
import {execute} from '../../main/ts'
import {createPipe as cp, getPipe} from '../../main/ts/pipe'
import {mapValues} from '../../main/ts/utils'
import {IMaskerPipeInput, IMaskerSchema} from '../../main/ts/interfaces'

describe('#getPipe', () => {
  const registry = new Map()
  const pipe = cp('pipe', () => ({value: 'pipe'}))
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
    const expectedSchema: IMaskerSchema = {
      'type': 'object',
      'properties': {
        'foo': {
          'type': 'object',
          'properties': {
            'bar': {
              'type': 'string',
              'maskerDirectives': ['striker'],
            },
          },
        },
        'a': {
          'type': 'object',
          'properties': {
            'b': {
              'type': 'object',
              'properties': [
                {
                  'type': 'string',
                  'maskerDirectives': ['striker'],
                },
                {
                  'type': 'object',
                  'properties': {
                    'c': {
                      'type': 'object',
                      'properties': {
                        'd': {
                          'type': 'string',
                          'maskerDirectives': ['striker'],
                        },
                      },
                    },
                    'e': {
                      'type': 'string',
                      'maskerDirectives': ['striker'],
                    },
                  },
                },
              ],
            },
          },
        },
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

    it('supports recursive flow', () => {
      const pipeline = [striker, splitter]
      const result = execute.sync({pipeline, value})
      expect(result.value).toEqual(expectedValue)
    })

    describe('schema', () => {
      it('builds schema while processes the pipeline', () => {
        const pipeline = ['striker', 'splitter']
        const result = execute.sync({pipeline, value, registry})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toEqual(expectedSchema)
      })

      it('uses context.schema if passed', () => {
        const result = execute.sync({schema: expectedSchema, value, registry})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toBe(expectedSchema)
      })

      it('uses context.schema if passed (async)', async () => {
        const result = await execute({schema: expectedSchema, value, registry, mode: IExecutionMode.ASYNC})

        expect(result.value).toEqual(expectedValue)
        expect(result.schema).toBe(expectedSchema)
      })
    })
  })
})
