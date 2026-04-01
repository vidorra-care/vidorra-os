import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from './App'
import { useWindowStore } from './stores/useWindowStore'

// Mock all child components to isolate App logic
vi.mock('./components/Desktop/Desktop', () => ({ Desktop: () => <div data-testid="desktop" /> }))
vi.mock('./components/Menubar/Menubar', () => ({ Menubar: () => <div data-testid="menubar" /> }))
vi.mock('./components/WindowManager/WindowManager', () => ({ WindowManager: () => <div data-testid="window-manager" /> }))
vi.mock('./components/Dock/Dock', () => ({ Dock: () => <div data-testid="dock" /> }))
vi.mock('@vidorra/kernel', () => ({
  appRegistry: { registerLocal: vi.fn(), getApp: vi.fn().mockReturnValue(null) },
}))

const mockOpenWindow = vi.fn()

vi.mock('./stores/useWindowStore')
const mockUseWindowStore = vi.mocked(useWindowStore)

describe('App — Welcome window first-launch logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockUseWindowStore.mockImplementation((selector: any) =>
      selector({ windows: [], openWindow: mockOpenWindow })
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('opens Welcome window when localStorage vidorra:welcomed is not set', () => {
    render(<App />)
    expect(mockOpenWindow).toHaveBeenCalledOnce()
    expect(mockOpenWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'welcome',
        title: 'Welcome to Vidorra OS',
      })
    )
  })

  it('does NOT open Welcome window when localStorage vidorra:welcomed is already set', () => {
    localStorage.setItem('vidorra:welcomed', '1')
    render(<App />)
    expect(mockOpenWindow).not.toHaveBeenCalled()
  })
})
