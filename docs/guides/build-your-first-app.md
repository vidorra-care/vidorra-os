# 构建你的第一个 App

本教程带你从零创建一个运行在 Vidorra OS 中的 App。

---

## 1. 创建项目

```bash
mkdir my-app && cd my-app
pnpm init
pnpm add @vidorra/sdk
```

---

## 2. 创建 manifest.json

在项目根目录创建 `public/manifest.json`：

```json
{
  "id": "com.yourname.my-app",
  "name": "我的第一个 App",
  "version": "1.0.0",
  "entry": "http://localhost:3000",
  "icon": "./icon.svg",
  "category": "utility",
  "defaultSize": { "width": 600, "height": 400 },
  "minSize": { "width": 300, "height": 200 }
}
```

---

## 3. 初始化 SDK

```ts
// src/main.ts
import { createApp } from '@vidorra/sdk'

const app = createApp()

async function main() {
  await app.ready()

  // 设置窗口标题
  app.window.setTitle('我的第一个 App')

  // 监听主题变化
  app.theme.subscribe(({ mode }) => {
    document.documentElement.dataset.theme = mode
  })
}

main()
```

---

## 4. 使用 CSS 变量

直接使用系统 CSS 变量，无需 JS：

```css
.container {
  background: var(--vos-bg-elevated);
  backdrop-filter: blur(var(--vos-blur));
  border-radius: var(--vos-radius-lg);
  color: var(--vos-text);
  font-family: var(--vos-font-sans);
}
```

---

## 5. 读写数据

```ts
// 声明权限（在 manifest.json 中）
// "permissions": ["datastore.write:com.yourname.my-app:notes"]

const notes = app.data.collection('com.yourname.my-app:notes')

// 写入
await notes.insert({
  id: crypto.randomUUID(),
  title: '第一条笔记',
  content: 'Hello Vidorra!',
  createdAt: new Date().toISOString(),
})

// 读取
const allNotes = await notes.query({
  orderBy: [{ field: 'createdAt', dir: 'desc' }]
})

// 实时订阅
notes.subscribe(records => {
  renderNoteList(records)
})
```

---

## 6. 安装到 Vidorra OS

在 Vidorra OS 的 App Store 中，点击「从 URL 安装」，输入：

```
http://localhost:3000/manifest.json
```

系统会读取 manifest，展示权限确认弹窗，确认后 App 出现在 Dock 中。

---

## 7. React 版本

如果使用 React，安装 `@vidorra/sdk-react`：

```tsx
import { VidorraProvider, useDataStore, useWindow } from '@vidorra/sdk-react'

function App() {
  return (
    <VidorraProvider>
      <NoteApp />
    </VidorraProvider>
  )
}

function NoteApp() {
  const win = useWindow()
  const { data: notes, loading } = useDataStore('com.yourname.my-app:notes', {
    orderBy: [{ field: 'createdAt', dir: 'desc' }]
  })

  useEffect(() => {
    win.setTitle(`笔记 (${notes?.length ?? 0})`)
  }, [notes?.length])

  if (loading) return <div>加载中...</div>

  return (
    <ul>
      {notes.map(note => <li key={note.id}>{note.title}</li>)}
    </ul>
  )
}
```

---

## 下一步

- [manifest.json 完整规范](../sdk/manifest.md)
- [SDK Core API](../sdk/sdk-core.md)
- [DataStore 设计](../kernel/data-store.md)
