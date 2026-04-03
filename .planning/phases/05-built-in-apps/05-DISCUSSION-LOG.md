# Phase 5: Built-in Apps - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 05-built-in-apps
**Areas discussed:** 交付架构, SDK 使用, App Store UI, Settings 范围

---

## 交付架构

| Option | Description | Selected |
|--------|-------------|----------|
| 多 Vite 进程（React app） | 每个 app 独立 Vite 开发服务器，独立端口 | ✓ |
| 纯静态 HTML | 所有 app 在 public/apps/ 下直接写 HTML+CSS+JS | |
| Vite build → shell public | 保留 Vite 结构，构建输出到 shell public | |

**User's choice:** 多 Vite 进程（React app）

**跟进问题：Shell 如何知道各内置 app 地址？**

| Option | Description | Selected |
|--------|-------------|----------|
| Shell Vite proxy 转发 | /apps/xxx/** → localhost:30xx | ✓ |
| entry 直接用绝对 URL | built-in-apps.json 里写 http://localhost:3010 | |

**Notes:** proxy 方案开发/生产 URL 一致，entry 路径统一

---

## SDK 使用

| Option | Description | Selected |
|--------|-------------|----------|
| App Store 用 SDK | app.ready() + app.theme.onChange() + app.window.setTitle() | ✓ |
| Settings 用 SDK | app.ready() + app.theme.onChange() | ✓ |
| Welcome 用 SDK | app.ready() + app.window.close() | ✓ |
| Calculator 用 SDK | （未提出，规格明确无 SDK 依赖） | |

**User's choice:** App Store、Settings、Welcome 均使用 SDK；Calculator 零依赖

---

## App Store UI

**卸载交互：**

| Option | Description | Selected |
|--------|-------------|----------|
| 悬停显示 ✕ 标记 | Launchpad 风格，悬停出现关闭按钮 | |
| 常时显示 Uninstall 按钮 | 卡片上始终有按钮 | |
| macOS 垃圾桶风格 | 拖拽到垃圾桶 + 右键 + 详情页按钮 | ✓ |

**User's choice:** 三种并行：① 拖拽到垃圾桶 ② 右键卸载选项 ③ 详情页 Uninstall 按钮

**整体布局：**

| Option | Description | Selected |
|--------|-------------|----------|
| 卡片网格 + 详情页 | 点击卡片进入 app 详情，含卸载按钮 | ✓ |
| 两栏布局 | 左导航 + 右内容区 | |

**"从 URL 安装"入口：**

| Option | Description | Selected |
|--------|-------------|----------|
| URL 输入框常驻 | 顶部搜索栏风格，随时可用 | |
| 模态弹窗 | 点击按钮弹出对话框 | ✓ |

---

## Settings 范围

| Option | Description | Selected |
|--------|-------------|----------|
| 仅 APP-03 范围 | 主题 + 壁纸，严格按需求来 | |
| APP-03 + 占位区域 | 主题 + 壁纸 + 未来 app 设置占位 | ✓ |

**整体布局：**

| Option | Description | Selected |
|--------|-------------|----------|
| 两栏导航 | 左侧列表 + 右侧内容（macOS 系统偏好风格） | ✓ |
| 单页滚动 | 上下区域分隔 | |

**壁纸选择：**

| Option | Description | Selected |
|--------|-------------|----------|
| 预设缩略图卡片 | 点击切换，2-3 张预设 | ✓ |
| 预设 + 自定义上传 | 额外支持 FileReader 上传 | |

---

## Claude's Discretion

- 各 app 内部组件拆分方式
- Calculator 运算引擎（eval 安全包装 vs 手写 parser）
- App Store 右键菜单实现方式
- Welcome app 是改造现有静态 HTML 还是重建为 React 项目

## Deferred Ideas

- JSON 驱动前端生成（低代码方向，v2 功能）
- 各 app 细粒度设置（Calculator 精度等，Settings 占位预留）
- Shell 层全局垃圾桶（Phase 5 垃圾桶限定在 App Store 窗口内）
