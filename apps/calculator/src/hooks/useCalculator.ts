import { useReducer } from 'react'

// ── types ──────────────────────────────────────────────────────────────────
export type OperatorT = '+' | '-' | '*' | '/'
export type DigitT = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type CalculatorKeyT = DigitT | OperatorT | '+/-' | '%' | 'AC' | '=' | '.'

export enum Mode {
  InsertFirstNumber = 'InsertFirstNumber',
  InsertDecimalFirstNumber = 'InsertDecimalFirstNumber',
  OperatorPressed = 'OperatorPressed',
  InsertSecondNumber = 'InsertSecondNumber',
  InsertDecimalSecondNumber = 'InsertDecimalSecondNumber',
  ShowingResult = 'ShowingResult',
}

export interface IState {
  mode: Mode
  firstNumber: number
  secondNumber: number
  operator: OperatorT | null
  result: string
}

export const initialState: IState = {
  mode: Mode.InsertFirstNumber,
  firstNumber: 0,
  secondNumber: 0,
  operator: null,
  result: '0',
}

export type ActionT = { type: 'Press'; payload: CalculatorKeyT }

// ── kept for existing tests ────────────────────────────────────────────────
export function evaluate(expr: string): number {
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) throw new Error('Invalid expression')
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + expr + ')')() as number
}

// ── reducer (ported from reference) ───────────────────────────────────────
function getMathResult({ first, operator, second }: { first: number; operator: OperatorT; second: number }): number {
  const r = (() => {
    switch (operator) {
      case '+': return first + second
      case '-': return first - second
      case '*': return first * second
      case '/': return first / second
    }
  })()
  return Number(r.toFixed(12))
}

function isDecimal(n: number) { return String(n).includes('.') }
function isOperator(v: unknown): v is OperatorT { return ['+', '-', '*', '/'].includes(v as string) }
function isDigit(v: unknown): v is DigitT { return [0,1,2,3,4,5,6,7,8,9].includes(v as number) }

export function calculatorReducer(state: IState, action: ActionT): IState {
  const { mode, firstNumber, secondNumber, operator, result } = state
  const payload = action.payload

  const isFirstNumberInput = [Mode.InsertFirstNumber, Mode.InsertDecimalFirstNumber, Mode.ShowingResult].includes(mode)
  const isOperatorPressed = [Mode.OperatorPressed, Mode.ShowingResult].includes(mode)

  function getInsertedNumberResult(digit: DigitT) {
    const existingNumber = isFirstNumberInput ? firstNumber : secondNumber
    if (isOperatorPressed) return { updatedResult: `${digit}`, updatedNumber: digit }
    const isDecimalMode = [Mode.InsertDecimalFirstNumber, Mode.InsertDecimalSecondNumber].includes(mode)
    const endsWithDot = isDecimalMode && !isDecimal(existingNumber)
    const updatedResult = endsWithDot ? `${existingNumber}.${digit}` : `${existingNumber === 0 ? '' : existingNumber}${digit}`
    const updatedNumber = endsWithDot ? Number(`${existingNumber}.${digit}`) : Number(`${result}${digit}`)
    return { updatedResult, updatedNumber }
  }

  function getEquationResult() {
    if (operator == null) return ![Mode.InsertSecondNumber, Mode.InsertDecimalSecondNumber].includes(mode) ? firstNumber : secondNumber
    return getMathResult({ first: firstNumber, second: secondNumber, operator })
  }

  if (isDigit(payload)) {
    const { updatedResult, updatedNumber } = getInsertedNumberResult(payload)
    return {
      ...state,
      mode: mode === Mode.OperatorPressed ? Mode.InsertSecondNumber : mode,
      result: updatedResult,
      ...(isFirstNumberInput ? { firstNumber: updatedNumber } : { secondNumber: updatedNumber }),
    }
  }

  if (payload === '.') {
    const isDecimalMode = [Mode.InsertDecimalFirstNumber, Mode.InsertDecimalSecondNumber].includes(mode)
    if (isDecimalMode) return state
    if (mode === Mode.ShowingResult) return { ...state, operator: null, mode: Mode.InsertDecimalFirstNumber, firstNumber: 0, result: '0.' }
    if (mode === Mode.OperatorPressed) return { ...state, mode: Mode.InsertDecimalSecondNumber, secondNumber: 0, result: '0.' }
    return {
      ...state,
      mode: isFirstNumberInput ? Mode.InsertDecimalFirstNumber : Mode.InsertDecimalSecondNumber,
      result: isFirstNumberInput ? `${firstNumber}.` : `${secondNumber}.`,
      ...(isFirstNumberInput ? { firstNumber } : { secondNumber }),
    }
  }

  if (isOperator(payload)) {
    if (mode === Mode.OperatorPressed) return { ...state, operator: payload }
    const builtResult = result.endsWith('.') ? result.slice(0, -1) : result
    const updatedResult = isFirstNumberInput
      ? builtResult
      : getMathResult({ first: firstNumber, second: secondNumber, operator: operator ?? payload })
    return { ...state, mode: Mode.OperatorPressed, operator: payload, firstNumber: Number(updatedResult), result: `${updatedResult}` }
  }

  if (payload === '+/-') {
    const updated = -Number(result)
    return { ...state, ...(isFirstNumberInput ? { firstNumber: updated } : { secondNumber: updated }), result: `${updated}` }
  }

  if (payload === '%') {
    const updated = isFirstNumberInput ? Number(result) / 100 : (secondNumber / 100) * firstNumber
    return { ...state, ...(isFirstNumberInput ? { firstNumber: updated } : { secondNumber: updated }), result: `${updated}` }
  }

  if (payload === '=') {
    const updated = getEquationResult()
    return { ...state, mode: Mode.ShowingResult, result: `${updated}`, firstNumber: updated }
  }

  // AC
  return initialState
}

// ── hook ──────────────────────────────────────────────────────────────────
export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const press = (key: CalculatorKeyT) => dispatch({ type: 'Press', payload: key })
  return { result: state.result, press }
}
