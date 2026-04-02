export interface MenuItemConfig {
  title: string
  disabled?: boolean
  breakAfter?: boolean
}

export interface MenuConfig {
  [menuId: string]: {
    title: string
    items: Record<string, MenuItemConfig>
  }
}

export const defaultMenuConfig: MenuConfig = {
  apple: {
    title: '',
    items: {
      'about': { title: 'About Vidorra OS', breakAfter: true },
      'preferences': { title: 'System Settings...', breakAfter: true },
      'sleep': { title: 'Sleep', disabled: true },
      'restart': { title: 'Restart...', disabled: true },
      'shutdown': { title: 'Shut Down...', disabled: true },
    },
  },
  finder: {
    title: 'Vidorra',
    items: {
      'about': { title: 'About Vidorra OS', breakAfter: true },
      'hide': { title: 'Hide Vidorra', disabled: true },
      'hide-others': { title: 'Hide Others', disabled: true },
    },
  },
  file: {
    title: 'File',
    items: {
      'new-window': { title: 'New Window', disabled: true, breakAfter: true },
      'close': { title: 'Close Window', disabled: true },
    },
  },
  edit: {
    title: 'Edit',
    items: {
      'undo': { title: 'Undo', disabled: true },
      'redo': { title: 'Redo', disabled: true, breakAfter: true },
      'cut': { title: 'Cut', disabled: true },
      'copy': { title: 'Copy', disabled: true },
      'paste': { title: 'Paste', disabled: true },
      'select-all': { title: 'Select All', disabled: true },
    },
  },
  window: {
    title: 'Window',
    items: {
      'minimize': { title: 'Minimize', disabled: true },
      'zoom': { title: 'Zoom', disabled: true, breakAfter: true },
      'bring-to-front': { title: 'Bring All to Front', disabled: true },
    },
  },
  help: {
    title: 'Help',
    items: {
      'help': { title: 'Vidorra Help', disabled: true },
    },
  },
}
