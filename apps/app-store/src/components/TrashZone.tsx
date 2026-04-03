import { useState } from 'react'
import styles from './TrashZone.module.css'

interface TrashZoneProps {
  visible: boolean
  onDrop: (appId: string) => void
}

export function TrashZone({ visible, onDrop }: TrashZoneProps) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      className={[
        styles.trashZone,
        visible ? styles.visible : '',
        isOver ? styles.active : '',
      ].join(' ')}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const appId = e.dataTransfer.getData('text/plain')
        if (appId) onDrop(appId)
      }}
      aria-label="Uninstall drop zone"
      aria-hidden={!visible}
    >
      {isOver ? 'Release to uninstall' : 'Drag here to uninstall'}
    </div>
  )
}
