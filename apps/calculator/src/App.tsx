import { useCalculator } from './hooks/useCalculator'
import styles from './App.module.css'

type ButtonDef = {
  label: string
  action: () => void
  className: string
  colSpan?: boolean
  radiusBL?: boolean
  radiusBR?: boolean
}

export default function App() {
  const calc = useCalculator()

  const buttons: ButtonDef[] = [
    { label: 'AC', action: calc.clear, className: styles.topRowButton },
    { label: '+/-', action: calc.toggleSign, className: styles.topRowButton },
    { label: '%', action: calc.percent, className: styles.topRowButton },
    { label: '÷', action: () => calc.appendOperator('/'), className: styles.operationButton },
    { label: '7', action: () => calc.appendDigit('7'), className: styles.numberButton },
    { label: '8', action: () => calc.appendDigit('8'), className: styles.numberButton },
    { label: '9', action: () => calc.appendDigit('9'), className: styles.numberButton },
    { label: '×', action: () => calc.appendOperator('*'), className: styles.operationButton },
    { label: '4', action: () => calc.appendDigit('4'), className: styles.numberButton },
    { label: '5', action: () => calc.appendDigit('5'), className: styles.numberButton },
    { label: '6', action: () => calc.appendDigit('6'), className: styles.numberButton },
    { label: '−', action: () => calc.appendOperator('-'), className: styles.operationButton },
    { label: '1', action: () => calc.appendDigit('1'), className: styles.numberButton },
    { label: '2', action: () => calc.appendDigit('2'), className: styles.numberButton },
    { label: '3', action: () => calc.appendDigit('3'), className: styles.numberButton },
    { label: '+', action: () => calc.appendOperator('+'), className: styles.operationButton },
    { label: '0', action: () => calc.appendDigit('0'), className: styles.numberButton, colSpan: true, radiusBL: true },
    { label: '.', action: calc.appendDecimal, className: styles.numberButton },
    { label: '=', action: calc.equals, className: styles.operationButton, radiusBR: true },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.showArea}>
        {calc.display}
      </div>
      <div className={styles.buttonsContainer}>
        {buttons.map((btn, i) => (
          <button
            key={i}
            className={[
              btn.className,
              btn.colSpan ? styles.colSpan2 : '',
              btn.radiusBL ? styles.radiusBL : '',
              btn.radiusBR ? styles.radiusBR : '',
            ].filter(Boolean).join(' ')}
            onClick={btn.action}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
