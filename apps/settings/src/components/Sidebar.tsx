import styles from './Sidebar.module.css'

type Panel = 'general' | 'wallpaper'

interface SidebarProps {
  activePanel: Panel
  onSelect: (panel: Panel) => void
}

export function Sidebar({ activePanel, onSelect }: SidebarProps) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sectionHeader}>System</div>
      <button
        className={[styles.navItem, activePanel === 'general' ? styles.active : ''].join(' ')}
        onClick={() => onSelect('general')}
      >
        General
      </button>
      <button
        className={[styles.navItem, activePanel === 'wallpaper' ? styles.active : ''].join(' ')}
        onClick={() => onSelect('wallpaper')}
      >
        Wallpaper
      </button>
      <button className={[styles.navItem, styles.disabled].join(' ')} disabled aria-disabled="true">
        Applications
      </button>
    </nav>
  )
}
