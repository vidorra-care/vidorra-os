// packages/kernel/src/theme-engine.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeEngine } from './theme-engine'

describe('ThemeEngine', () => {
  let engine: ThemeEngine

  beforeEach(() => {
    localStorage.clear()
    // Reset CSS variables
    document.documentElement.removeAttribute('style')
    engine = new ThemeEngine()
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('setMode', () => {
    it('sets mode to dark and applies dark CSS variables', () => {
      engine.setMode('dark')

      expect(engine.getMode()).toBe('dark')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#1e1e2e')
      expect(
        document.documentElement.style.getPropertyValue('--color-text'),
      ).toBe('#cdd6f4')
    })

    it('sets mode to light and applies light CSS variables', () => {
      engine.setMode('dark')
      engine.setMode('light')

      expect(engine.getMode()).toBe('light')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#ffffff')
      expect(
        document.documentElement.style.getPropertyValue('--color-text'),
      ).toBe('#1a1a1a')
    })

    it('notifies subscribers when mode changes', () => {
      const callback = vi.fn()
      engine.subscribe(callback)
      engine.setMode('dark')

      expect(callback).toHaveBeenCalledWith('dark')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('persists mode to localStorage', () => {
      engine.setMode('dark')

      expect(localStorage.getItem('vidorra:theme')).toBe('dark')
    })
  })

  describe('getResolvedMode', () => {
    it('returns light when mode is light', () => {
      engine.setMode('light')
      expect(engine.getResolvedMode()).toBe('light')
    })

    it('returns dark when mode is dark', () => {
      engine.setMode('dark')
      expect(engine.getResolvedMode()).toBe('dark')
    })

    it('returns dark when mode is auto and system prefers dark', () => {
      // happy-dom supports matchMedia — mock it to prefer dark
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })

      const darkEngine = new ThemeEngine()
      darkEngine.setMode('auto')
      expect(darkEngine.getResolvedMode()).toBe('dark')
      darkEngine.destroy()
    })

    it('returns light when mode is auto and system prefers light', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false, // system prefers light
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })

      const lightEngine = new ThemeEngine()
      lightEngine.setMode('auto')
      expect(lightEngine.getResolvedMode()).toBe('light')
      lightEngine.destroy()
    })
  })

  describe('subscribe', () => {
    it('returns an unsubscribe function that stops notifications', () => {
      const callback = vi.fn()
      const unsubscribe = engine.subscribe(callback)

      engine.setMode('dark')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      engine.setMode('light')
      expect(callback).toHaveBeenCalledTimes(1) // no additional calls
    })

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      engine.subscribe(cb1)
      engine.subscribe(cb2)

      engine.setMode('dark')
      expect(cb1).toHaveBeenCalledWith('dark')
      expect(cb2).toHaveBeenCalledWith('dark')
    })
  })

  describe('persistence', () => {
    it('restores mode from localStorage on construction', () => {
      localStorage.setItem('vidorra:theme', 'dark')
      const freshEngine = new ThemeEngine()

      expect(freshEngine.getMode()).toBe('dark')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#1e1e2e')
      freshEngine.destroy()
    })

    it('defaults to light mode when localStorage is empty', () => {
      expect(engine.getMode()).toBe('light')
    })
  })
})
