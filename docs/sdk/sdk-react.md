# SDK React Hooks

`@vidorra/sdk-react` 提供 React hooks 封装，按需安装。

```bash
pnpm add @vidorra/sdk-react
```

---

## useVidorraApp

初始化 SDK，在组件树顶层调用一次：

```tsx
import { VidorraProvider } from '@vidorra/sdk-react'

function App() {
  return (
    <VidorraProvider>
      <MyApp />
    </VidorraProvider>
  )
}
```

---

## useWindow

```tsx
import { useWindow } from '@vidorra/sdk-react'

function Header({ title }: { title: string }) {
  const win = useWindow()

  useEffect(() => {
    win.setTitle(title)
  }, [title])

  return (
    <header>
      <button onClick={() => win.minimize()}>最小化</button>
    </header>
  )
}
```

---

## useTheme

```tsx
import { useTheme } from '@vidorra/sdk-react'

function ThemedPanel() {
  const { mode } = useTheme()

  return (
    <div data-theme={mode} className="panel">
      {/* CSS 变量自动生效 */}
    </div>
  )
}
```

---

## useDataStore

```tsx
import { useDataStore } from '@vidorra/sdk-react'

function TransactionList() {
  const { data, loading, error } = useDataStore(
    'com.yourname.budget:transactions',
    { where: { month: '2024-06' }, orderBy: [{ field: 'date', dir: 'desc' }] }
  )

  if (loading) return <Spinner />
  if (error) return <ErrorView error={error} />

  return (
    <ul>
      {data.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
    </ul>
  )
}
```

`useDataStore` 自动订阅实时更新，组件卸载时自动取消订阅。

---

## useMenuAction

```tsx
import { useMenuAction } from '@vidorra/sdk-react'

function MyApp() {
  useMenuAction('new-entry', () => {
    openNewEntryModal()
  })

  useMenuAction('export-csv', () => {
    exportData()
  })

  return <MainView />
}
```

---

## useNotifications

```tsx
import { useNotifications } from '@vidorra/sdk-react'

function BudgetAlert({ amount }: { amount: number }) {
  const notify = useNotifications()

  useEffect(() => {
    if (amount > 5000) {
      notify.send({
        title: '支出预警',
        body: `本月支出已超过 ¥5,000`,
      })
    }
  }, [amount])

  return null
}
```
