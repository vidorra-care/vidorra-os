import { describe, it, expect } from 'vitest'
import { evaluate } from './useCalculator'

describe('evaluate — arithmetic expression evaluator', () => {
  it('respects operator precedence: multiply before add (APP-04)', () => {
    expect(evaluate('12 + 34 * 5')).toBe(182)
  })

  it('basic division', () => {
    expect(evaluate('10 / 2')).toBe(5)
  })

  it('decimal arithmetic', () => {
    expect(evaluate('3.5 + 1.5')).toBe(5)
  })

  it('zero input', () => {
    expect(evaluate('0')).toBe(0)
  })

  it('subtraction', () => {
    expect(evaluate('100 - 37')).toBe(63)
  })

  it('chained operators with correct precedence', () => {
    expect(evaluate('2 + 3 * 4 - 1')).toBe(13)
  })

  it('division by zero returns Infinity or NaN', () => {
    const result = evaluate('1 / 0')
    expect(!isFinite(result) || isNaN(result)).toBe(true)
  })
})
