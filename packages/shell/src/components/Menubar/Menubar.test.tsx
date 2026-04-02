import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Menubar } from './Menubar'
import { useWindowStore } from '../../stores/useWindowStore'
import { useMenubarStore } from '../../stores/useMenubarStore'

// Mock the window store
vi.mock('../../stores/useWindowStore')
// Mock the menubar store
vi.mock('../../stores/useMenubarStore')

const mockUseWindowStore = vi.mocked(useWindowStore)
const mockUseMenubarStore = vi.mocked(useMenubarStore)

function makeMenubarStoreMock(overrides: Partial<ReturnType<typeof useMenubarStore>> = {}) {
  const defaults = {
    activeMenu: '',
    setActiveMenu: vi.fn(),
    closeMenu: vi.fn(),
  }
  mockUseMenubarStore.mockReturnValue({ ...defaults, ...overrides } as ReturnType<typeof useMenubarStore>)
}

describe('Menubar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    makeMenubarStoreMock()
    mockUseWindowStore.mockImplementation((selector: (s: Parameters<typeof mockUseWindowStore>[0] extends (s: infer S) => unknown ? S : never) => unknown) =>
      selector({ windows: [], nextZIndex: 1, openWindow: vi.fn(), closeWindow: vi.fn(), focusWindow: vi.fn(), unfocusAll: vi.fn(), setWindowState: vi.fn(), setWindowRect: vi.fn(), toggleMaximize: vi.fn() })
    )
  })

  it('renders the default Vidorra menu title', () => {
    render(<Menubar />)
    expect(screen.getByText('Vidorra')).toBeInTheDocument()
  })

  it('renders all default top-level menu labels', () => {
    render(<Menubar />)
    expect(screen.getByText('File')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Window')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('renders a clock string matching HH:mm pattern', () => {
    render(<Menubar />)
    // Clock should display a string like "09:45" or "14:30"
    const clockEl = document.querySelector('[class*="clock"]')
    expect(clockEl).not.toBeNull()
    expect(clockEl!.textContent).toMatch(/^\d{2}:\d{2}$/)
  })
})
