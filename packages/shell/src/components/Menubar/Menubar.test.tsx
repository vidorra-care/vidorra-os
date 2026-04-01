import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Menubar } from './Menubar'
import { useWindowStore } from '../../stores/useWindowStore'

// Mock the window store
vi.mock('../../stores/useWindowStore')
// Mock appRegistry
vi.mock('@vidorra/kernel', () => ({
  appRegistry: { getApp: vi.fn().mockReturnValue(null) },
}))
// Mock ContextMenu to avoid deep render complexity
vi.mock('../ContextMenu/ContextMenu', () => ({
  ContextMenu: () => <div data-testid="context-menu" />,
}))

const mockUseWindowStore = vi.mocked(useWindowStore)

describe('Menubar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Vidorra OS" as app name when no window is focused', () => {
    // No focused window
    mockUseWindowStore.mockImplementation((selector: (s: Parameters<typeof mockUseWindowStore>[0] extends (s: infer S) => unknown ? S : never) => unknown) =>
      selector({ windows: [], nextZIndex: 1, openWindow: vi.fn(), closeWindow: vi.fn(), focusWindow: vi.fn(), setWindowState: vi.fn(), setWindowRect: vi.fn() })
    )
    render(<Menubar />)
    expect(screen.getByText('Vidorra OS')).toBeInTheDocument()
  })

  it('shows the focused window title when a window is focused', () => {
    mockUseWindowStore.mockImplementation((selector: (s: Parameters<typeof mockUseWindowStore>[0] extends (s: infer S) => unknown ? S : never) => unknown) =>
      selector({
        windows: [
          { id: 'w1', appId: 'notes', title: 'Notes', focused: true, state: 'normal', zIndex: 1, url: '', icon: '', rect: { x: 0, y: 0, width: 400, height: 300 } },
        ],
        nextZIndex: 2,
        openWindow: vi.fn(),
        closeWindow: vi.fn(),
        focusWindow: vi.fn(),
        setWindowState: vi.fn(),
        setWindowRect: vi.fn(),
      })
    )
    render(<Menubar />)
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('renders a clock string matching HH:mm pattern', () => {
    mockUseWindowStore.mockImplementation((selector: (s: Parameters<typeof mockUseWindowStore>[0] extends (s: infer S) => unknown ? S : never) => unknown) =>
      selector({ windows: [], nextZIndex: 1, openWindow: vi.fn(), closeWindow: vi.fn(), focusWindow: vi.fn(), setWindowState: vi.fn(), setWindowRect: vi.fn() })
    )
    render(<Menubar />)
    // Clock should display a string like "09:45" or "14:30"
    const clockEl = document.querySelector('[class*="clock"]')
    expect(clockEl).not.toBeNull()
    expect(clockEl!.textContent).toMatch(/^\d{2}:\d{2}$/)
  })
})
