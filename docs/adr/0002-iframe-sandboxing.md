# ADR-0002 iframe 沙箱

**状态**：已采纳
**日期**：2026-03

## 背景

需要让第三方 App 在系统中运行，同时保证安全隔离。主要备选方案：iframe 沙箱 vs Module Federation vs Web Components。

## 决策

使用 `<iframe sandbox>` 作为 App 运行容器。

## 理由

**安全隔离**：
- iframe 有独立的 JS 运行时、CSS 作用域、localStorage
- `sandbox` 属性可以精确控制权限（scripts、forms、popups 等）
- 即使 App 代码有 XSS 漏洞，也无法访问宿主页面的 DOM

**框架无关**：
- App 可以用任何技术栈，只需能部署为 Web 页面
- 不需要 App 遵循特定的模块格式

**部署独立**：
- App 部署在自己的域名，独立发布，不需要重新部署系统
- 支持私有部署（企业内网 App）

## 备选方案

**Module Federation**：
- 优点：性能更好，可以共享依赖
- 缺点：App 必须用 Webpack/Vite，框架受限；安全隔离弱，App 代码运行在同一 JS 上下文
- 放弃原因：安全性不足，框架绑定

**Web Components + Shadow DOM**：
- 优点：CSS 隔离好
- 缺点：JS 不隔离，无法阻止 App 访问 `window` 对象
- 放弃原因：安全隔离不够

## 权衡

**接受的限制**：
- iframe 通信只能通过 postMessage，有序列化开销
- 无法共享 React 实例，每个 App 加载自己的框架（增加内存）
- 跨 iframe 的 CSS 变量需要通过 JS 注入（ThemeEngine 处理）

**缓解措施**：
- postMessage 开销通过 KernelBus 的批处理和缓存缓解
- 内存问题通过限制同时运行的 App 数量缓解（P2）
