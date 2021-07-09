import {execSync} from 'child_process'
import {resolve} from 'path'

describe('masquer',() => {
  it('applies @qiwi/masker to the input', () => {
    const input = '4111 1111 1111 1111'
    const cli = resolve(__dirname, '../../../target/es5/index.js')
    const result = execSync(`node ${cli} "${input}"`).toString().trim()

    expect(result).toBe('4111 **** **** 1111')
  })
})
