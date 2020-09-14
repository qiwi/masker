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
      const fakeExec = jest.fn(() => Promise.resolve({value: bbb}))
      const fakeExecSync = jest.fn(() => ({value: aaa}))
      // @ts-ignore
      const execute = enrichExecutor(fakeExec)
      // @ts-ignore
      const executeSync = enrichExecutor(fakeExecSync)

      beforeEach(() => {
        fakeExec.mockClear()
        fakeExecSync.mockClear()
      })

      const cases: [string, any, IExecutor, any, any, string?, ReturnType<typeof jest.fn>?, any?][] = [
        [
          'skips strings',
          pipe.execSync,
          executeSync,
          'foobar',
          'foobar',
        ],
        [
          'skips numbers',
          pipe.exec,
          execute,
          123,
          123,
        ],
        [
          'array to array (sync)',
          pipe.execSync,
          executeSync,
          [1, 'foo'],
          [aaa, aaa],
          undefined,
          fakeExecSync,
          {path: '0'},
        ],
        [
          'array to array (async)',
          pipe.exec,
          execute,
          [1, 'foo'],
          [bbb, bbb],
          undefined,
          fakeExec,
          {path: '0'},
        ],
        [
          'object to object (sync)',
          pipe.execSync,
          executeSync,
          {foo: 'foo', bar: 'bar'},
          {[aaa]: aaa, [aaa + '(2)']: aaa},
          undefined,
          fakeExecSync,
          {path: 'foo'},
        ],
        [
          'object to object (async)',
          pipe.exec,
          execute,
          {foo: 'foo', bar: 'bar'},
          {[bbb]: bbb, [bbb + '(2)']: bbb},
          'prev',
          fakeExec,
          {path: 'prev.foo'},
        ],
      ]

      cases.forEach(([name, handler, execute, input, expected, path, faceExec, fakeArg]) =>
        it(name, async() => {
          const context = normalizeContext({value: input, path}, execute)
          const result = await handler(context)

          expect(result.value).toEqual(expected)
          faceExec && expect(faceExec).toHaveBeenCalledWith(expect.objectContaining(fakeArg))
        }))
    })
  })
})
