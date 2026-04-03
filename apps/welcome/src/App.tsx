import styles from './App.module.css'

interface AppProps {
  onGetStarted: () => void
}

export default function App({ onGetStarted }: AppProps) {
  const handleGetStarted = () => {
    // Shell's App.tsx already sets 'vidorra:welcomed' before opening Welcome,
    // so we only need to close the window (per APP-05 research note)
    localStorage.setItem('vidorra:welcomed', '1') // idempotent — safe to set again
    onGetStarted()
  }

  return (
    <div className={styles.container}>
      <img
        src="/app-icons/welcome.svg"
        alt="Vidorra OS"
        className={styles.icon}
        width={80}
        height={80}
      />
      <h1 className={styles.headline}>Welcome to Vidorra OS</h1>
      <p className={styles.body}>
        A macOS-style desktop in your browser. Open apps, switch themes, and explore.
      </p>
      <button className={styles.cta} onClick={handleGetStarted}>
        Get Started
      </button>
    </div>
  )
}
