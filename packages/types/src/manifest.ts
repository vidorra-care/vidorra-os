export interface AppManifest {
  id: string
  name: string
  version: string
  entry: string
  icon: string
  category: string
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  permissions?: string[]
  menubar?: Record<string, MenuItem[]>
  spotlightActions?: SpotlightAction[]
}

export interface MenuItem {
  label: string
  action: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
}

export interface SpotlightAction {
  title: string
  action: string
  icon?: string
}
