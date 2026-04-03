import { useCalculator } from './hooks/useCalculator'
import styles from './App.module.css'

// Inline SVG paths from @mdi/js (no external dep needed)
const mdiPlusMinusVariant = 'M3,5H11V11H3V5M9,7H5V9H9V7M13,13H21V19H13V13M19,15H15V17H19V15M3,21L21,3'
const mdiPercentOutline = 'M7.5,5.6L5,7L6.4,4.5L5,2L7.5,3.4L10,2L8.6,4.5L10,7L7.5,5.6M19.5,15.4L22,14L20.6,16.5L22,19L19.5,17.6L17,19L18.4,16.5L17,14L19.5,15.4M22,2L2,22L2,22L22,2M14.59,9.17L9.17,14.59C8.78,15 8.78,15.63 9.17,16.02C9.56,16.41 10.19,16.41 10.59,16.02L16,10.59C16.41,10.2 16.41,9.57 16,9.17C15.62,8.78 15,8.78 14.59,9.17M8,7C8,7.55 7.55,8 7,8C6.45,8 6,7.55 6,7C6,6.45 6.45,6 7,6C7.55,6 8,6.45 8,7M18,17C18,17.55 17.55,18 17,18C16.45,18 16,17.55 16,17C16,16.45 16.45,16 17,16C17.55,16 18,16.45 18,17Z'
const mdiClose = 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z'
const mdiDivision = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'
const mdiMinus = 'M19,13H5V11H19V13Z'

function Icon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d={path} />
    </svg>
  )
}

export default function App() {
  const { result, press } = useCalculator()

  return (
    <section className={styles.container}>
      <section className={styles.showArea}>{result}</section>
      <section className={styles.buttonsContainer}>
        <button className={styles.topRowButton} onClick={() => press('AC')}>
          {Number(result) !== 0 ? 'C' : 'AC'}
        </button>
        <button className={styles.topRowButton} onClick={() => press('+/-')}>
          <Icon path={mdiPlusMinusVariant} />
        </button>
        <button className={styles.topRowButton} onClick={() => press('%')}>
          <Icon path={mdiPercentOutline} />
        </button>
        <button className={styles.operationButton} onClick={() => press('/')}>
          <Icon path={mdiDivision} />
        </button>

        <button className={styles.numberButton} onClick={() => press(7)}>7</button>
        <button className={styles.numberButton} onClick={() => press(8)}>8</button>
        <button className={styles.numberButton} onClick={() => press(9)}>9</button>
        <button className={styles.operationButton} onClick={() => press('*')}>
          <Icon path={mdiClose} />
        </button>

        <button className={styles.numberButton} onClick={() => press(4)}>4</button>
        <button className={styles.numberButton} onClick={() => press(5)}>5</button>
        <button className={styles.numberButton} onClick={() => press(6)}>6</button>
        <button className={styles.operationButton} onClick={() => press('-')}>
          <Icon path={mdiMinus} size={24} />
        </button>

        <button className={styles.numberButton} onClick={() => press(1)}>1</button>
        <button className={styles.numberButton} onClick={() => press(2)}>2</button>
        <button className={styles.numberButton} onClick={() => press(3)}>3</button>
        <button className={styles.operationButton} onClick={() => press('+')}>+</button>

        <button
          className={`${styles.numberButton} ${styles.curvedBottomLeftButton}`}
          style={{ gridColumn: '1 / span 2', justifyContent: 'flex-start', paddingLeft: '1.25rem' }}
          onClick={() => press(0)}
        >
          0
        </button>
        <button className={styles.numberButton} onClick={() => press('.')}>.</button>
        <button
          className={`${styles.operationButton} ${styles.curvedBottomRightButton}`}
          onClick={() => press('=')}
        >
          =
        </button>
      </section>
    </section>
  )
}
