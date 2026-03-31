# SDK 概览

## 设计理念

`@vidorra/sdk` 是一个轻量级的 postMessage 封装库。

- **SDK 是协议适配器，不是框架**。用 React 的 App 可以用，用 Vue 的也可以用，纯 HTML 脚本引入即可。
- **核心不超过 8KB gzip**。React hooks 封装在独立的 `@vidorra/sdk-react` 包中，按需安装。
- **Promise 化 API**。所有异步操作返回 Promise，支持 async/await。
- **类型完整**。提供完整的 TypeScript 类型定义，自动补全友好。

---

## 安装

```bash
# npm
npm install @vidorra/sdk

# pnpm
pnpm add @vidorra/sdk

# CDN（框架无关场景）
<script src="https://cdn.vidorra.dev/sdk.min.js"></script>
```

React 项目额外安装 hooks：

```bash
pnpm add @vidorra/sdk-react
```

---

## 初始化

```ts
import { createApp } from '@vidorra/sdk'

const app = createApp()

// 等待内核握手完成后才能调用 API
await app.ready()

// 之后可以调用所有 API
app.window.setTitle('我的 App')
```

CDN 方式：

```html
<script src="https://cdn.vidorra.dev/sdk.min.js"></script>
<script>
  const app = VidorraOS.createApp()
  app.ready().then(() => {
    app.window.setTitle('Hello Vidorra')
  })
</script>
```

---

## 运行环境检测

SDK 在非 Vidorra OS 环境中（如独立部署）会进入 standalone 模式，API 调用静默忽略或返回默认值：

```ts
const app = createApp()
await app.ready()

console.log(app.isVidorraOS)  // true | false

// standalone 模式下，window.setTitle 不报错，只是不生效
app.window.setTitle('My App')
```

这让 App 可以同时作为独立 Web App 和 Vidorra App 运行。

---

## 相关文档

- [manifest.json 规范](./manifest.md)
- [SDK Core API](./sdk-core.md)
- [SDK React Hooks](./sdk-react.md)
- [构建你的第一个 App](../guides/build-your-first-app.md)
