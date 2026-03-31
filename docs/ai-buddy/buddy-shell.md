# AI Buddy UI 组件

## BuddyShell

浮动面板组件，是 AI Buddy 的视觉容器。

---

## 状态

```ts
type BuddyState =
  | 'hidden'      // 完全隐藏
  | 'minimized'   // 最小化为 Dock 图标
  | 'panel'       // 浮动面板（默认）
  | 'fullscreen'  // 全屏模式
```

---

## 面板布局

```
┌─────────────────────────────────┐
│  ✦ Buddy                  ⊡ ×  │  TitleBar（可拖拽）
├─────────────────────────────────┤
│                                 │
│  [对话历史区域]                  │  MessageList（可滚动）
│                                 │
│  ┌─────────────────────────┐    │
│  │ 工具调用卡片             │    │  ToolCallCard
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  [输入框]                  [↑]  │  InputBar
└─────────────────────────────────┘
```

---

## 消息类型

```ts
type Message =
  | { role: 'user';      content: string }
  | { role: 'assistant'; content: string; streaming?: boolean }
  | { role: 'tool-call'; tool: string; input: unknown; status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'error' }
  | { role: 'tool-result'; toolCallId: string; result: unknown }
  | { role: 'system';    content: string }  // 系统提示，如「已开始新对话」
```

---

## 工具调用卡片

工具调用以卡片形式展示，状态变化有动画：

```
pending   → 显示工具名和参数预览，等待确认
confirmed → 执行中，显示 spinner
done      → 显示结果摘要，绿色
error     → 显示错误信息，红色
cancelled → 显示「已取消」，灰色
```

---

## 快捷键

| 快捷键 | 动作 |
|--------|------|
| `⌘B` | 打开 / 关闭 Buddy 面板 |
| `Esc` | 关闭面板（或取消当前工具调用） |
| `⌘Enter` | 发送消息 |
| `⌘K` | 清空对话历史 |
| `⌘F` | 切换全屏模式 |

---

## 全屏模式

全屏模式下，BuddyShell 占据整个桌面（在所有窗口之上），类似 Claude Code 的终端体验：

- 左侧：对话历史
- 右侧：工具调用详情 / 代码预览（P3）
- 底部：输入框

退出全屏：`Esc` 或点击右上角按钮。

---

## 消息列表高度计算（Pretext）

AI 流式输出时，消息气泡高度随内容增长。直接依赖 DOM 测量会触发 reflow，导致滚动区域跳动。

使用 `@chenglou/pretext` 在渲染前预估气泡高度：

```ts
import { prepare, layout } from '@chenglou/pretext'

// 在字体加载完成后初始化一次
const prepared = await prepare(assistantFontConfig)

// 流式 token 追加时，预估当前消息高度
function estimateMessageHeight(text: string, containerWidth: number): number {
  const result = layout(prepared, text, containerWidth - 32) // 减去 padding
  return result.height + 24 // 加上气泡 padding
}

// 用于决定是否需要自动滚动到底部
function shouldAutoScroll(listEl: HTMLElement, estimatedNewHeight: number): boolean {
  const { scrollTop, scrollHeight, clientHeight } = listEl
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  return distanceFromBottom < estimatedNewHeight + 40
}
```

**效果**：流式输出时滚动区域平滑增长，不出现内容突然跳位的问题。
