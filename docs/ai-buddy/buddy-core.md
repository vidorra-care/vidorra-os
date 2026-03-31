# BuddyCore

## 职责

管理与 AI 模型的通信、对话上下文、流式输出、工具调用循环。

---

## 对话循环

参考 Claude Code 的 agentic loop 设计：

```
用户输入
  │
  ▼
构建消息（注入系统上下文）
  │
  ▼
调用 AI API（流式）
  │
  ├─ 文本 token → 实时渲染到 BuddyShell
  │
  └─ 工具调用 → ToolExecutor
       │
       ├─ 展示工具调用确认（需要确认的操作）
       ├─ 执行工具
       ├─ 将结果追加到消息历史
       └─ 继续调用 AI API（携带工具结果）
            │
            └─ 循环，直到 AI 不再调用工具
```

---

## 消息历史管理

对话历史存储在内存中，不持久化（刷新后重置）。可选持久化到 DataStore（P3）。

上下文窗口管理：
- 超过 token 限制时，自动截断最早的消息
- 保留 system prompt 和最近 N 轮对话
- 工具调用结果超长时截断，附加「结果已截断」提示

---

## 系统 Prompt

```
你是 Vidorra OS 的内置 AI 助手。

当前系统状态：
- 运行中的 App：{appList}
- 当前聚焦的 App：{focusedApp}
- 当前时间：{datetime}

你可以使用以下工具操作系统：
{toolDescriptions}

操作规则：
1. 执行写入操作前，先向用户说明将要做什么
2. 不确定用户意图时，先询问确认
3. 操作失败时，清晰说明原因和替代方案
4. 不访问用户未授权的 App 数据
```

---

## 流式输出

使用 Anthropic SDK 的流式 API：

```ts
const stream = await anthropic.messages.stream({
  model: 'claude-opus-4-6',
  max_tokens: 4096,
  system: buildSystemPrompt(systemContext),
  messages: conversationHistory,
  tools: BUDDY_TOOLS,
})

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    if (chunk.delta.type === 'text_delta') {
      buddyShell.appendText(chunk.delta.text)
    }
    if (chunk.delta.type === 'input_json_delta') {
      buddyShell.updateToolCallPreview(chunk.delta.partial_json)
    }
  }
  if (chunk.type === 'content_block_stop') {
    if (currentBlock.type === 'tool_use') {
      await toolExecutor.execute(currentBlock)
    }
  }
}
```

---

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 网络超时 | 显示重试按钮，保留已输出内容 |
| API 限流 | 显示等待提示，自动重试 |
| 工具执行失败 | 将错误信息返回给 AI，让 AI 决定如何处理 |
| 用户取消工具调用 | 将「用户取消」作为工具结果返回给 AI |
| 上下文超限 | 自动截断历史，提示用户「已开始新对话」 |

---

## 相关文档

- [系统工具列表](./tools.md)
- [系统上下文注入](./system-context.md)
