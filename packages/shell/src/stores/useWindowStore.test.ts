import { describe, it, expect, beforeEach } from 'vitest'
import { useWindowStore } from './useWindowStore'
import type { WindowDescriptor, WindowRect } from '@vidorra/types'

const BASE_RECT: WindowRect = { x: 100, y: 100, width: 800, height: 600 }

function makeDescriptor(overrides: Partial<Omit<WindowDescriptor, 'zIndex' | 'focused'>> = {}): Omit<WindowDescriptor, 'zIndex' | 'focused'> {
  return {
    id: 'win-1',
    appId: 'app-1',
    title: 'Test Window',
    url: 'http://localhost:3001',
    icon: 'icon.png',
    rect: { ...BASE_RECT },
    state: 'normal',
    ...overrides,
  }
}

beforeEach(() => {
  useWindowStore.setState({ windows: [], nextZIndex: 1 })
})

describe('openWindow', () => {
  it('adds a window to the store', () => {
    const { openWindow } = useWindowStore.getState()
    openWindow(makeDescriptor())
    const { windows } = useWindowStore.getState()
    expect(windows).toHaveLength(1)
    expect(windows[0].id).toBe('win-1')
  })

  it('applies staircase offset (+20px per existing non-minimized window)', () => {
    const { openWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    openWindow(makeDescriptor({ id: 'win-2' }))
    openWindow(makeDescriptor({ id: 'win-3' }))

    const { windows } = useWindowStore.getState()
    const win1 = windows.find(w => w.id === 'win-1')!
    const win2 = windows.find(w => w.id === 'win-2')!
    const win3 = windows.find(w => w.id === 'win-3')!

    // win1: 0 offset (no existing non-minimized windows)
    expect(win1.rect.x).toBe(100)
    expect(win1.rect.y).toBe(100)
    // win2: 1 existing -> +20
    expect(win2.rect.x).toBe(120)
    expect(win2.rect.y).toBe(120)
    // win3: 2 existing -> +40
    expect(win3.rect.x).toBe(140)
    expect(win3.rect.y).toBe(140)
  })

  it('assigns incrementing zIndex and sets focused=true on new window, focused=false on all others', () => {
    const { openWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    openWindow(makeDescriptor({ id: 'win-2' }))

    const { windows } = useWindowStore.getState()
    const win1 = windows.find(w => w.id === 'win-1')!
    const win2 = windows.find(w => w.id === 'win-2')!

    expect(win1.focused).toBe(false)
    expect(win2.focused).toBe(true)
    expect(win2.zIndex).toBeGreaterThan(win1.zIndex)
  })

  it('does not apply staircase offset based on minimized windows', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    setWindowState('win-1', 'minimized')
    openWindow(makeDescriptor({ id: 'win-2' }))

    const { windows } = useWindowStore.getState()
    const win2 = windows.find(w => w.id === 'win-2')!
    // win-1 is minimized, so 0 non-minimized windows -> no offset
    expect(win2.rect.x).toBe(100)
    expect(win2.rect.y).toBe(100)
  })
})

describe('closeWindow', () => {
  it('removes the window by id', () => {
    const { openWindow, closeWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    openWindow(makeDescriptor({ id: 'win-2' }))
    closeWindow('win-1')

    const { windows } = useWindowStore.getState()
    expect(windows).toHaveLength(1)
    expect(windows[0].id).toBe('win-2')
  })

  it('focuses topmost remaining window when closing the focused window', () => {
    const { openWindow, closeWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    openWindow(makeDescriptor({ id: 'win-2' }))
    openWindow(makeDescriptor({ id: 'win-3' }))
    // win-3 is focused (most recently opened)
    closeWindow('win-3')

    const { windows } = useWindowStore.getState()
    // win-2 should now be focused (it had the next highest zIndex)
    const focused = windows.filter(w => w.focused)
    expect(focused).toHaveLength(1)
    expect(focused[0].id).toBe('win-2')
  })
})

describe('focusWindow', () => {
  it('sets the target window focused=true with highest zIndex, all others focused=false', () => {
    const { openWindow, focusWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    openWindow(makeDescriptor({ id: 'win-2' }))
    openWindow(makeDescriptor({ id: 'win-3' }))
    // win-3 is focused; now focus win-1
    focusWindow('win-1')

    const { windows } = useWindowStore.getState()
    const win1 = windows.find(w => w.id === 'win-1')!
    const win2 = windows.find(w => w.id === 'win-2')!
    const win3 = windows.find(w => w.id === 'win-3')!

    expect(win1.focused).toBe(true)
    expect(win2.focused).toBe(false)
    expect(win3.focused).toBe(false)
    expect(win1.zIndex).toBeGreaterThan(win2.zIndex)
    expect(win1.zIndex).toBeGreaterThan(win3.zIndex)
  })

  it('on already-focused window still increments zIndex', () => {
    const { openWindow, focusWindow } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    const zBefore = useWindowStore.getState().windows.find(w => w.id === 'win-1')!.zIndex
    focusWindow('win-1')
    const zAfter = useWindowStore.getState().windows.find(w => w.id === 'win-1')!.zIndex
    expect(zAfter).toBeGreaterThan(zBefore)
  })
})

describe('setWindowState', () => {
  it('changes window state to minimized', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    setWindowState('win-1', 'minimized')
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.state).toBe('minimized')
  })

  it('setWindowState minimized sets focused=false on the minimized window', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    setWindowState('win-1', 'minimized')
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.focused).toBe(false)
  })

  it('setWindowState maximized saves preMaximizeRect', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1', rect: { x: 50, y: 50, width: 400, height: 300 } }))
    setWindowState('win-1', 'maximized')
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.state).toBe('maximized')
    expect(win.preMaximizeRect).toEqual({ x: 50, y: 50, width: 400, height: 300 })
  })

  it('setWindowState normal restores rect from preMaximizeRect', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1', rect: { x: 50, y: 50, width: 400, height: 300 } }))
    setWindowState('win-1', 'maximized')
    // Simulate rect being set to fullscreen after maximizing
    useWindowStore.setState(state => ({
      windows: state.windows.map(w => w.id === 'win-1' ? { ...w, rect: { x: 0, y: 0, width: 1920, height: 1080 } } : w)
    }))
    setWindowState('win-1', 'normal')
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.state).toBe('normal')
    expect(win.rect).toEqual({ x: 50, y: 50, width: 400, height: 300 })
    expect(win.preMaximizeRect).toBeUndefined()
  })
})

describe('setWindowRect', () => {
  it('updates position and size of a window', () => {
    const { openWindow, setWindowRect } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1' }))
    setWindowRect('win-1', { x: 200, y: 150, width: 1000, height: 700 })
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.rect).toEqual({ x: 200, y: 150, width: 1000, height: 700 })
  })
})

describe('toggleMaximize', () => {
  it('toggles from normal to maximized', () => {
    const { openWindow, toggleMaximize } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1', state: 'normal' }))
    toggleMaximize('win-1')
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.state).toBe('maximized')
    expect(win.preMaximizeRect).toBeDefined()
  })

  it('toggles from maximized back to normal, restoring preMaximizeRect', () => {
    const { openWindow, toggleMaximize } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1', rect: { x: 50, y: 50, width: 400, height: 300 } }))
    toggleMaximize('win-1') // maximize
    toggleMaximize('win-1') // restore
    const win = useWindowStore.getState().windows.find(w => w.id === 'win-1')!
    expect(win.state).toBe('normal')
    expect(win.rect).toEqual({ x: 50, y: 50, width: 400, height: 300 })
  })
})

describe('multiple windows', () => {
  it('can have multiple windows with independent state', () => {
    const { openWindow, setWindowState } = useWindowStore.getState()
    openWindow(makeDescriptor({ id: 'win-1', title: 'Window 1' }))
    openWindow(makeDescriptor({ id: 'win-2', title: 'Window 2' }))
    openWindow(makeDescriptor({ id: 'win-3', title: 'Window 3' }))

    setWindowState('win-2', 'minimized')

    const { windows } = useWindowStore.getState()
    expect(windows).toHaveLength(3)
    expect(windows.find(w => w.id === 'win-1')!.state).toBe('normal')
    expect(windows.find(w => w.id === 'win-2')!.state).toBe('minimized')
    expect(windows.find(w => w.id === 'win-3')!.state).toBe('normal')
  })
})
