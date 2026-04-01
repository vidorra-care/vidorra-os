import { useEffect } from 'react'

export function useRaf(callback: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    let id: number
    const loop = () => {
      callback()
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
