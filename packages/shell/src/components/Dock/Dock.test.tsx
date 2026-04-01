import { render, screen, fireEvent } from '@testing-library/react'
import { motionValue } from 'framer-motion'
import { DockItem } from './DockItem'
import { useWindowStore } from '../../stores/useWindowStore'

const mockApp = {
  id: 'test-app',
  name: 'Test App',
  version: '1.0.0',
  entry: '/apps/test/index.html',
  icon: '/app-icons/test.svg',
  category: 'utility',
  defaultSize: { width: 800, height: 600 },
}

describe('DockItem', () => {
  const mouseX = motionValue<number | null>(Infinity)

  beforeEach(() => {
    useWindowStore.setState({ windows: [], nextZIndex: 1 })
  })

  describe('SHELL-04: running indicator', () => {
    it('shows running dot when a window is open for the appId', () => {
      useWindowStore.setState({
        windows: [
          {
            id: 'win-1',
            appId: 'test-app',
            title: 'Test',
            url: '/test',
            icon: '/test.svg',
            rect: { x: 0, y: 0, width: 800, height: 600 },
            state: 'normal',
            focused: true,
            zIndex: 1,
            minWidth: 200,
            minHeight: 150,
          },
        ],
        nextZIndex: 2,
      })
      render(<DockItem app={mockApp} mouseX={mouseX} isRunning={true} onOpen={() => {}} />)
      const dot = screen.getByTestId('running-dot')
      expect(dot.className).not.toContain('dotHidden')
    })

    it('hides running dot when no window is open for the appId', () => {
      render(<DockItem app={mockApp} mouseX={mouseX} isRunning={false} onOpen={() => {}} />)
      const dot = screen.getByTestId('running-dot')
      // dot opacity controlled via CSS variable --opacity set to 0
      expect(dot).toBeInTheDocument()
      // When isRunning=false, --opacity is set to 0
      const style = dot.getAttribute('style') || ''
      expect(style).toContain('--opacity')
      expect(style).toContain('0')
    })
  })

  describe('SHELL-05: right-click context menu', () => {
    it('shows 3 items when right-clicking a running app: 打开, 在 Dock 中隐藏, 关闭', () => {
      render(<DockItem app={mockApp} mouseX={mouseX} isRunning={true} onOpen={() => {}} />)
      const item = screen.getByAltText('Test App')
      fireEvent.contextMenu(item)
      expect(screen.getByText('打开')).toBeInTheDocument()
      expect(screen.getByText('在 Dock 中隐藏')).toBeInTheDocument()
      expect(screen.getByText('关闭')).toBeInTheDocument()
    })

    it('shows 1 item when right-clicking a non-running app: 打开', () => {
      render(<DockItem app={mockApp} mouseX={mouseX} isRunning={false} onOpen={() => {}} />)
      const item = screen.getByAltText('Test App')
      fireEvent.contextMenu(item)
      expect(screen.getByText('打开')).toBeInTheDocument()
      expect(screen.queryByText('关闭')).not.toBeInTheDocument()
      expect(screen.queryByText('在 Dock 中隐藏')).not.toBeInTheDocument()
    })
  })
})
