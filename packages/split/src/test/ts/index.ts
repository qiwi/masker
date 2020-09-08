// mport {normalizeContext, execute} from '@qiwi/masker-common'
import {
  pipe,
  name,
} from '../../main/ts'

import {
  enrichExecutor,
  IExecutor,
  normalizeContext,
} from '@qiwi/masker-common'

describe('split', () => {
  it('name is defined', () => {
    expect(name).toBe('split')
    expect(pipe.name).toBe(name)
  })

  describe('pipe', () => {
    describe('splits objects/arrays and applies the executor to each item', () => {
      const aaa = '***sync***'
      const bbb = '***async***'
      // @ts-ignore
      const execute = enrichExecutor(jest.fn(() => Promise.resolve({value: bbb})))
      // @ts-ignore
      const executeSync = enrichExecutor(jest.fn(() => ({value: aaa})))

      const cases: [string, any, IExecutor, any, any][] = [
        [
          'array to array (sync)',
          pipe.execSync,
          executeSync,
          [1, 'foo'],
          [aaa, aaa],
        ],
        [
          'array to array (async)',
          pipe.exec,
          execute,
          [1, 'foo'],
          [bbb, bbb],
        ],
        [
          'object to object (sync)',
          pipe.execSync,
          executeSync,
          {foo: 'foo', bar: 'bar'},
          {foo: aaa, bar: aaa},
        ],
        [
          'object to object (async)',
          pipe.exec,
          execute,
          {foo: 'foo', bar: 'bar'},
          {foo: bbb, bar: bbb},
        ],
      ]

      cases.forEach(([name, handler, execute, input, expected]) =>
        it(name, async() => {
          const context = normalizeContext({value: input}, execute)
          const result = await handler(context)

          expect(result.value).toEqual(expected)
        }))
    })
  })
})
