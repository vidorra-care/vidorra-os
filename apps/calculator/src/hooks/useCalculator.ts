import { useState } from 'react'

export function evaluate(expr: string): number {
  // Validate: allow only digits, operators, parens, decimals, whitespace
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) {
    throw new Error('Invalid expression')
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')() as number
    return result
  } catch {
    throw new Error('Invalid expression')
  }
}

export interface CalculatorState {
  display: string
  expression: string
  hasResult: boolean
}

export function useCalculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const appendDigit = (digit: string) => {
    if (hasResult) {
      setExpression(digit)
      setDisplay(digit)
      setHasResult(false)
      return
    }
    const next = expression === '0' ? digit : expression + digit
    setExpression(next)
    setDisplay(next)
  }

  const appendOperator = (op: string) => {
    setHasResult(false)
    const next = expression + ' ' + op + ' '
    setExpression(next)
    setDisplay(op)
  }

  const equals = () => {
    try {
      const result = evaluate(expression)
      const resultStr = Number.isFinite(result) ? String(result) : 'Error'
      setDisplay(resultStr)
      setExpression(resultStr)
      setHasResult(true)
    } catch {
      setDisplay('Error')
      setExpression('')
      setHasResult(false)
    }
  }

  const clear = () => {
    setDisplay('0')
    setExpression('')
    setHasResult(false)
  }

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return
    try {
      const val = parseFloat(display)
      const negated = String(-val)
      setDisplay(negated)
      setExpression(negated)
    } catch { /* no-op */ }
  }

  const percent = () => {
    try {
      const val = parseFloat(display)
      const pct = String(val / 100)
      setDisplay(pct)
      setExpression(pct)
    } catch { /* no-op */ }
  }

  const appendDecimal = () => {
    if (display.includes('.')) return
    const next = (expression || '0') + '.'
    setExpression(next)
    setDisplay(display + '.')
  }

  return { display, appendDigit, appendOperator, equals, clear, toggleSign, percent, appendDecimal }
}
