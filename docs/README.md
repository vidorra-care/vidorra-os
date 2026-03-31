# Vidorra OS — 文档索引

Vidorra OS 是一个以 macOS 为美学基准的可扩展 Web 桌面操作系统底座。
任何技术栈的 Web App 都可以运行在其中，通过 iframe 沙箱隔离，通过 SDK 与系统通信。

---

## 文档导航

### 产品
| 文档 | 说明 |
|------|------|
| [产品设计文档（PRD）](./product/prd.md) | 市场定位、竞品分析、架构、路线图、风险 |

### 架构
| 文档 | 说明 |
|------|------|
| [架构总览](./architecture/overview.md) | 四层架构、核心设计决策 |
| [分层详解](./architecture/layers.md) | Kernel / Shell / Bridge / App 各层职责 |
| [安全模型](./architecture/security-model.md) | iframe 沙箱、权限系统、origin 鉴权 |
| [数据流](./architecture/data-flow.md) | 消息流转、DataStore 读写流程 |
| [Self-Hosted & 多端同步](./architecture/self-hosted.md) | 部署模式、StorageAdapter、同步策略、公网分享、访客权限 |

### 内核模块
| 文档 | 说明 |
|------|------|
| [WindowManager](./kernel/window-manager.md) | 窗口生命周期、拖拽、层级管理 |
| [AppRegistry](./kernel/app-registry.md) | manifest 解析、App 安装/卸载/启动 |
| [KernelBus](./kernel/kernel-bus.md) | postMessage RPC、双向通信协议 |
| [DataStore](./kernel/data-store.md) | 跨应用数据层、命名空间、权限控制 |
| [FileSystem](./kernel/file-system.md) | 虚拟文件系统（VFS） |
| [ShortcutManager](./kernel/shortcut-manager.md) | 全局快捷键注册与路由 |
| [ThemeEngine](./kernel/theme-engine.md) | CSS 变量系统、Dark Mode |

### Shell 组件
| 文档 | 说明 |
|------|------|
| [Shell 组件](./shell/shell-components.md) | Menubar、Dock、Spotlight、Notifications 等 |

### AI Buddy
| 文档 | 说明 |
|------|------|
| [AI Buddy 概览](./ai-buddy/overview.md) | 定位、体验目标、模块组成 |
| [BuddyCore](./ai-buddy/buddy-core.md) | 对话循环、流式输出、错误处理 |
| [系统工具列表](./ai-buddy/tools.md) | AI 可调用的所有工具及权限 |
| [系统上下文注入](./ai-buddy/system-context.md) | 向 AI 注入桌面状态的机制 |
| [UI 组件](./ai-buddy/buddy-shell.md) | 浮动面板、消息类型、快捷键 |
| [Prompt Engineering](./ai-buddy/prompt-engineering.md) | 从 Claude Code 源码学到的 prompt 设计模式 |

### SDK
| 文档 | 说明 |
|------|------|
| [SDK 概览](./sdk/overview.md) | 设计理念、安装、初始化 |
| [manifest.json 规范](./sdk/manifest.md) | 字段定义、权限声明、完整示例 |
| [SDK Core API](./sdk/sdk-core.md) | window、notifications、data、theme |
| [SDK React Hooks](./sdk/sdk-react.md) | useWindow、useTheme、useDataStore |

### API 参考
| 文档 | 说明 |
|------|------|
| [KernelBus 消息协议](./api/kernel-bus-api.md) | 所有消息类型定义 |
| [DataStore API](./api/data-store-api.md) | query、insert、update、delete、subscribe |
| [Window API](./api/window-api.md) | 窗口控制完整接口 |

### 开发指南
| 文档 | 说明 |
|------|------|
| [快速开始](./guides/getting-started.md) | 环境搭建、运行项目 |
| [构建你的第一个 App](./guides/build-your-first-app.md) | 从零创建一个 Vidorra App |
| [贡献指南](./guides/contributing.md) | 代码规范、PR 流程 |
| [测试指南](./guides/testing.md) | 单元测试、集成测试策略 |

### 架构决策记录（ADR）
| 文档 | 说明 |
|------|------|
| [ADR 索引](./adr/README.md) | 所有决策记录列表 |
| [ADR-0001 Monorepo 结构](./adr/0001-monorepo-structure.md) | 为什么用 pnpm workspaces |
| [ADR-0002 iframe 沙箱](./adr/0002-iframe-sandboxing.md) | 为什么选 iframe 而非 Module Federation |
| [ADR-0003 postMessage RPC](./adr/0003-postmessage-rpc.md) | KernelBus 协议设计 |
| [ADR-0004 IndexedDB via Dexie](./adr/0004-indexeddb-via-dexie.md) | DataStore 持久化选型 |
| [ADR-0005 权限模型](./adr/0005-permission-model.md) | 三级权限规则设计 |

### 应用商店
| 文档 | 说明 |
|------|------|
| [App Store 设计](./app-store/design.md) | Registry 结构、发布流程、私有部署 |

---

## 快速链接

- 产品设计文档：[webos-product-design.html](../webos-product-design.html)
- Claude Code 借鉴参考：[claude-code-reference.md](../claude-code-reference.md)
