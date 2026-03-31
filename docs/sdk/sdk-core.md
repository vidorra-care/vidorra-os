# SDK Core API

## window

### `app.window.setTitle(title)`
设置窗口标题栏文字。

```ts
app.window.setTitle('记账本 — 2024年6月')
```

### `app.window.resize(size)`
调整窗口大小。

```ts
app.window.resize({ width: 1200, height: 800 })
```

### `app.window.getRect()`
获取当前窗口的位置和尺寸。

```ts
const rect = await app.window.getRect()
// { x, y, width, height, minWidth, minHeight }
```

### `app.window.requestFullscreen()`
请求全屏模式。

```ts
await app.window.requestFullscreen()
```

### `app.window.minimize()`
最小化窗口。

### `app.window.focus()`
将窗口置于前台并聚焦。

### `app.window.createChild(options)`
创建子窗口（modal 或独立窗口）。

```ts
const childWin = await app.window.createChild({
  url: '/settings',
  title: '偏好设置',
  modal: true,
  size: { width: 560, height: 400 },
})
```

### `app.window.close()`
关闭当前窗口。

---

## notifications

### `app.notifications.send(options)`

```ts
await app.notifications.send({
  title: '月度账单已生成',
  body: '2024年6月支出 ¥3,240，点击查看明细',
  icon: './icon.svg',
  onClick: () => app.window.focus(),
})
```

---

## data

### `app.data.collection(namespace)`

返回一个 collection 操作对象。

```ts
const col = app.data.collection('com.yourname.budget:transactions')
```

### `.query(filter?)`

```ts
const records = await col.query({
  where: { month: '2024-06' },
  orderBy: [{ field: 'date', dir: 'desc' }],
  limit: 50,
})
```

### `.insert(record)`

```ts
await col.insert({
  id: crypto.randomUUID(),
  amount: -128.5,
  category: '餐饮',
  date: '2024-06-15',
})
```

### `.update(id, patch)`

```ts
await col.update(id, { note: '已报销' })
```

### `.delete(id)`

```ts
await col.delete(id)
```

### `.subscribe(callback)`

```ts
const unsub = col.subscribe(records => {
  renderList(records)
})

// 取消订阅
unsub()
```

---

## theme

### `app.theme.get()`

```ts
const { mode, tokens } = await app.theme.get()
// mode: 'light' | 'dark'
// tokens: Record<string, string>  CSS 变量值
```

### `app.theme.subscribe(callback)`

```ts
app.theme.subscribe(({ mode, tokens }) => {
  document.documentElement.dataset.theme = mode
})
```

---

## 事件监听

### `app.on('menu:action', handler)`

接收菜单栏点击事件（由 manifest.menubar 定义）：

```ts
app.on('menu:action', ({ action }) => {
  switch (action) {
    case 'new-entry': openNewEntryModal(); break
    case 'export-csv': exportData(); break
  }
})
```

### `app.on('spotlight:action', handler)`

接收 Spotlight 深度链接：

```ts
app.on('spotlight:action', ({ action, params }) => {
  if (action === 'open?modal=new-entry') {
    openNewEntryModal()
  }
})
```

### `app.on('window:resize', handler)`

窗口尺寸变化时触发：

```ts
app.on('window:resize', ({ width, height }) => {
  adjustLayout(width, height)
})
```
