import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Desktop } from './Desktop'

// Mock ContextMenu to render its items as simple buttons for testability
vi.mock('../ContextMenu/ContextMenu', () => ({
  ContextMenu: ({ items }: { items: Array<{ label?: string; separator?: boolean; action?: () => void }> }) => (
    <div data-testid="context-menu">
      {items.map((item, i) =>
        item.separator
          ? <hr key={i} data-testid="context-menu-separator" />
          : <button key={i} onClick={item.action}>{item.label}</button>
      )}
    </div>
  ),
}))

describe('Desktop', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('applies wallpaper URL from localStorage when set', () => {
    localStorage.setItem('vidorra:wallpaper', '/wallpapers/ocean.jpg')
    const { container } = render(<Desktop />)
    const desktop = container.firstElementChild as HTMLElement
    expect(desktop.style.backgroundImage).toContain('/wallpapers/ocean.jpg')
  })

  it('falls back to default wallpaper when localStorage is empty', () => {
    const { container } = render(<Desktop />)
    const desktop = container.firstElementChild as HTMLElement
    expect(desktop.style.backgroundImage).toContain('/wallpapers/default.png')
  })

  it('shows context menu with 4 items (including separator) on right-click', () => {
    render(<Desktop />)
    const desktop = document.querySelector('[class*="desktop"]') as HTMLElement
    fireEvent.contextMenu(desktop)
    // 3 label items + 1 separator = 4 entries
    const menu = screen.getByTestId('context-menu')
    const buttons = menu.querySelectorAll('button')
    const separators = menu.querySelectorAll('[data-testid="context-menu-separator"]')
    expect(buttons.length + separators.length).toBe(4)
  })
})
