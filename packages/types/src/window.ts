import type { WindowStyle } from './manifest'

export type WindowState = 'normal' | 'minimized' | 'maximized'

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowDescriptor {
  id: string
  appId: string
  title: string
  url: string
  icon: string
  rect: WindowRect
  state: WindowState
  focused: boolean
  zIndex: number
  windowStyle?: WindowStyle
  windowBackground?: string
  immersiveTitlebar?: boolean
}
