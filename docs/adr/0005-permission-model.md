# ADR-0005 三级权限模型

**状态**：已采纳
**日期**：2026-03

## 背景

App 需要访问系统能力（通知、数据、文件系统），需要设计一套权限系统，平衡安全性和用户体验。

## 决策

三级权限规则：`alwaysAllow` / `alwaysAsk` / `alwaysDeny`。

## 规则定义

**alwaysAllow**：无需弹窗，直接执行。适用于低风险、用户期望无感的操作。
- 窗口控制（setTitle、resize、minimize）
- 发送通知
- 读取主题
- 读写自己的私有数据

**alwaysAsk**：安装时弹窗，用户确认后写入 AuthStore，后续无需再次确认。
- 读取其他 App 的数据
- 读写共享文件系统
- 访问剪贴板（P3）

**alwaysDeny**：永远拒绝，无论用户是否同意。
- 写入 `com.vidorra.system:*`（系统数据）
- 写入 `com.global:*`（全局数据，由系统在初始化时预置，任何 App 不可写）
- 访问其他 App 的私有数据（即使用户同意也不行）

## 理由

**为什么不用 Android/iOS 的运行时权限**：
- 运行时弹窗打断用户流程，体验差
- 安装时一次性确认，用户可以在安装前做决策
- 参考 macOS App Store 的权限模型

**为什么有 alwaysDeny**：
- 某些操作即使用户同意也不应该允许（防止用户被社会工程学攻击）
- 系统数据的完整性必须由系统保证，不能委托给用户判断

## AI Buddy 的特殊处理

AI Buddy 的工具调用采用分级确认规则，而非直接套用 `alwaysAllow`：

**不需要确认**（只读操作和低风险操作）：
- `app_list`、`app_open`：查询或打开 App
- `data_query`、`get_namespace_schema`：读取数据或 schema
- `spotlight_search`：搜索
- `notification_send`：发送通知
- `window_arrange`：排列窗口

**逐次确认**（写入操作，不支持「始终允许」）：
- `data_insert`、`data_update`、`data_delete`：写入 DataStore
- `app_install`：安装新 App

这是因为 AI 的行为不可完全预测，写入操作需要保持用户的控制感；而只读操作不改变系统状态，无需打断用户。
