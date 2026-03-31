# Prompt Engineering — 从 Claude Code 源码学到的

> 基于对 `prompts.ts`（914行）、`systemPromptSections.ts`、`systemPrompt.ts` 的完整阅读。
> 这些模式直接适用于 Vidorra OS 的 AI Buddy 设计。

---

## 一、静态/动态边界切割（最重要的工程决策）

Claude Code 用一个常量把 system prompt 一刀切成两段：

```ts
export const SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'
```

**边界之前**（所有用户共享，可全局缓存）：
- 身份定义
- 安全准则
- 做事原则
- 工具使用规则
- 输出风格

**边界之后**（每个用户不同，不缓存或按 org 缓存）：
- 用户的 CLAUDE.md 配置
- 当前工作目录、OS 信息
- 已连接的 MCP 服务器说明
- 自动记忆文件
- Git 仓库状态

**为什么重要**：Anthropic API 的 prompt cache 按前缀哈希缓存。静态部分不变，每次请求都命中缓存，节省大量 token 费用和首 token 延迟。动态部分每次重新计算，保证个性化。

**Vidorra AI Buddy 的对应设计**：

```ts
// 静态部分（所有用户共享）
const BUDDY_STATIC_PROMPT = `
你是 Vidorra OS 的内置 AI 助手。
[身份定义、行为准则、工具使用规则...]
`

// 动态边界
const BUDDY_DYNAMIC_BOUNDARY = '__BUDDY_DYNAMIC_BOUNDARY__'

// 动态部分（每次对话重新构建）
async function buildBuddyDynamicPrompt(ctx: SystemContext): Promise<string> {
  return [
    `当前时间：${formatDatetime(new Date())}`,
    `运行中的 App：${ctx.runningApps.map(a => a.name).join('、')}`,
    `当前聚焦：${ctx.focusedApp?.name ?? '无'}`,
    ctx.accessibleNamespaces.length > 0
      ? `你可以访问的数据：\n${formatNamespaces(ctx.accessibleNamespaces)}`
      : null,
  ].filter(Boolean).join('\n')
}
```

---

## 二、Section 缓存系统（动态内容的精细控制）

Claude Code 的 `systemPromptSections.ts` 实现了一个轻量级的 section 级缓存：

```ts
// 普通 section：计算一次，/clear 前一直复用
systemPromptSection('memory', () => loadMemoryPrompt())

// 危险 section：每次都重新计算（会破坏 prompt cache）
// 必须写明原因
DANGEROUS_uncachedSystemPromptSection(
  'mcp_instructions',
  () => getMcpInstructionsSection(mcpClients),
  'MCP servers connect/disconnect between turns',  // 强制写原因
)
```

**核心洞察**：不是所有动态内容都需要每次重算。用户的记忆文件、语言偏好、输出风格——这些在一次对话中不会变，可以缓存。只有真正会变的内容（MCP 连接状态、当前时间）才需要每次重算。

**Vidorra AI Buddy 的对应设计**：

```ts
type BuddySection = {
  name: string
  compute: () => string | null | Promise<string | null>
  volatile: boolean  // true = 每次重算，false = 对话内缓存
}

const BUDDY_SECTIONS: BuddySection[] = [
  // 稳定 section：对话内缓存
  { name: 'user_prefs',    volatile: false, compute: () => loadUserPreferences() },
  { name: 'data_schemas',  volatile: false, compute: () => buildDataSchemaContext() },

  // 易变 section：每次重算
  { name: 'running_apps',  volatile: true,  compute: () => buildRunningAppsContext() },
  { name: 'current_time',  volatile: true,  compute: () => `当前时间：${formatDatetime(new Date())}` },
  { name: 'focused_app',   volatile: true,  compute: () => buildFocusedAppContext() },
]
```

---

## 三、工具描述是 Prompt 的一部分（token 成本意识）

Claude Code 源码里有一个关键注释（`api.ts`）：

> Each MCP server's tool definitions consume ~4000-6000 tokens.
> With 5 MCP servers, tool descriptions alone occupy ~12% of context.

工具不是越多越好，每个工具描述都有认知成本和 token 成本。

Claude Code 的做法：
- 工具描述按 session 缓存（`toolToAPISchema()` 带缓存），防止 mid-session 描述漂移
- 工具描述写得极其精确，避免歧义导致 AI 误用
- 按 feature flag 条件加载工具，不用的工具不注入

**Vidorra AI Buddy 的工具描述原则**：

```ts
// ❌ 模糊的工具描述
{
  name: 'data_query',
  description: '查询数据',
}

// ✅ Claude Code 风格：精确、有边界、说明限制
{
  name: 'data_query',
  description: `查询 DataStore 中的数据记录。
只能查询用户已明确授权 Buddy 访问的命名空间。
返回最多 ${MAX_QUERY_RESULTS} 条记录，超出时提示用户缩小范围。
不支持跨命名空间 JOIN 查询。`,
  input_schema: { ... }
}
```

---

## 四、Prompt 的结构化写法（`prependBullets` 模式）

Claude Code 的 prompt 不是一大段文字，而是结构化的 section + bullet：

```ts
function getSimpleDoingTasksSection(): string {
  const items = [
    `主要任务描述...`,
    `规则一...`,
    `规则二...`,
    [  // 子 bullet
      `子规则 a`,
      `子规则 b`,
    ],
  ]
  return [`# Doing tasks`, ...prependBullets(items)].join('\n')
}
```

**为什么这样写**：
- 结构清晰，AI 更容易解析和遵循
- 每条规则独立，便于 A/B 测试（加一条、删一条、改一条）
- 代码可维护，不是一个大字符串

**Vidorra AI Buddy 的 Prompt 结构**：

```ts
function buildBuddySystemPrompt(ctx: SystemContext): string {
  const sections = [
    buildIdentitySection(),
    buildCapabilitiesSection(ctx.accessibleNamespaces),
    buildBehaviorRulesSection(),
    buildToolUsageSection(),
    BUDDY_DYNAMIC_BOUNDARY,
    buildContextSection(ctx),
  ]
  return sections.filter(Boolean).join('\n\n')
}

function buildBehaviorRulesSection(): string {
  const rules = [
    '执行写入操作前，先向用户说明将要做什么，等待确认',
    '不确定用户意图时，先询问而不是猜测',
    '操作失败时，清晰说明原因和替代方案',
    '不访问用户未授权的 App 数据',
    '回答简洁直接，不用 emoji，不用过度礼貌的开场白',
  ]
  return ['## 行为规则', ...rules.map(r => ` - ${r}`)].join('\n')
}
```

---

## 五、条件注入（按 feature flag 和上下文裁剪 prompt）

Claude Code 大量使用条件注入，不同场景注入不同内容：

```ts
// 按用户类型注入不同规则
...(process.env.USER_TYPE === 'ant' ? [
  `如果你注意到用户的请求基于误解，说出来。你是协作者，不只是执行者。`,
] : []),

// 按工具可用性注入
hasAskUserQuestionTool
  ? `如果不理解用户为何拒绝工具调用，使用 ${ASK_USER_QUESTION_TOOL_NAME} 询问。`
  : null,

// 按 feature flag 注入
feature('VERIFICATION_AGENT') && getFeatureValue_CACHED('tengu_hive_evidence', false)
  ? `非平凡实现完成后，必须启动独立验证 agent...`
  : null,
```

**Vidorra AI Buddy 的对应设计**：

```ts
function buildContextSection(ctx: SystemContext): string {
  const parts = [
    // 始终注入
    `当前时间：${formatDatetime(new Date())}`,

    // 按状态条件注入
    ctx.runningApps.length > 0
      ? `运行中的 App：${ctx.runningApps.map(a => a.name).join('、')}`
      : '当前没有运行中的 App',

    ctx.focusedApp
      ? `当前聚焦：${ctx.focusedApp.name}（${ctx.focusedApp.id}）`
      : null,

    // 只在有授权数据时注入 schema（避免无意义的 token 消耗）
    ctx.accessibleNamespaces.length > 0
      ? buildNamespaceContext(ctx.accessibleNamespaces)
      : null,
  ]
  return parts.filter(Boolean).join('\n')
}
```

---

## 六、`<system-reminder>` 标签模式（动态注入不破坏缓存）

Claude Code 用 `<system-reminder>` 标签在 user message 中注入动态上下文，而不是修改 system prompt：

```ts
// context.ts
export function prependUserContext(messages, userContext) {
  // 把动态内容注入到第一条 user message 前面
  // 这样 system prompt 保持不变（缓存命中），动态内容走 user message
  return [
    { role: 'user', content: `<system-reminder>\n${userContext}\n</system-reminder>\n${messages[0].content}` },
    ...messages.slice(1),
  ]
}
```

**为什么这样做**：修改 system prompt 会破坏 prompt cache。把动态内容放进 user message 的 `<system-reminder>` 标签，system prompt 保持不变，缓存继续命中。

**Vidorra AI Buddy 的对应设计**：

```ts
// 每次对话时，把最新的系统状态注入为 system-reminder
// 而不是修改 system prompt
function buildTurnContext(ctx: SystemContext): string {
  return `<system-reminder>
当前时间：${formatDatetime(new Date())}
运行中的 App：${ctx.runningApps.map(a => a.name).join('、') || '无'}
当前聚焦：${ctx.focusedApp?.name ?? '无'}
</system-reminder>`
}

// 在每次 API 调用前，把 system-reminder 注入到最新的 user message
function injectTurnContext(messages: Message[], ctx: SystemContext): Message[] {
  const reminder = buildTurnContext(ctx)
  const last = messages[messages.length - 1]
  return [
    ...messages.slice(0, -1),
    { ...last, content: `${reminder}\n${last.content}` },
  ]
}
```

---

## 七、Prompt 的「可逆性」原则（Actions Section）

Claude Code 的 `getActionsSection()` 是整个 prompt 中最精心设计的部分之一：

```
Carefully consider the reversibility and blast radius of actions.
- 本地可逆操作（编辑文件、运行测试）：自由执行
- 难以逆转的操作（force push、删除分支）：先确认
- 影响共享状态的操作（push、发消息）：先确认

Authorization stands for the scope specified, not beyond.
用户批准一次 git push，不代表批准所有 git push。
```

**Vidorra AI Buddy 的对应设计**：

```ts
const BUDDY_ACTIONS_SECTION = `
## 操作安全原则

在执行操作前，评估其可逆性和影响范围：

**无需确认（低风险、可逆）**：
- 查询数据（data_query）
- 打开 App（app_open）
- 搜索（spotlight_search）
- 发送通知（notification_send）

**必须确认（写入、不可逆）**：
- 写入数据（data_insert、data_update、data_delete）
- 安装/卸载 App
- 修改系统设置

用户确认一次写入操作，不代表授权后续所有写入。
每次写入都需要独立确认。
`
```

---

## 八、输出效率指令（两套风格的对比）

Claude Code 为内部用户（ant）和外部用户维护了两套不同的输出风格指令，这个设计思路值得借鉴：

**外部用户版（简洁直接）**：
```
Go straight to the point. Try the simplest approach first.
Lead with the answer or action, not the reasoning.
Skip filler words, preamble, and unnecessary transitions.
```

**内部用户版（更丰富的沟通）**：
```
Before your first tool call, briefly state what you're about to do.
Write for a person who has stepped away and lost the thread.
Use complete, grammatically correct sentences.
```

**Vidorra AI Buddy 的启示**：根据用户的使用场景（快速问答 vs 复杂任务）动态调整输出风格。可以在 Settings 中让用户选择 Buddy 的回复风格。

---

## 九、完整的 Buddy System Prompt 模板

综合以上所有模式，Vidorra AI Buddy 的 system prompt 结构：

```ts
// packages/shell/src/ai-buddy/prompt.ts

export const BUDDY_STATIC_PROMPT = `
你是 Vidorra OS 的内置 AI 助手。

## 能力范围
你可以帮助用户：
- 打开和操作已安装的 App
- 查询和写入用户授权的数据
- 搜索 App 和内容
- 发送系统通知
- 排列窗口布局

## 行为规则
 - 执行写入操作前，先向用户说明将要做什么，等待确认
 - 不确定用户意图时，先询问而不是猜测
 - 操作失败时，清晰说明原因和替代方案
 - 不访问用户未授权的 App 数据
 - 回答简洁直接，不用 emoji

## 操作安全
 - 查询、打开 App、搜索：无需确认，直接执行
 - 写入数据、修改设置：每次都需要用户确认
 - 用户确认一次，不代表授权后续所有同类操作
`.trim()

// 动态边界
export const BUDDY_DYNAMIC_BOUNDARY = '__BUDDY_DYNAMIC_BOUNDARY__'

// 每次对话重新构建的动态部分
export async function buildBuddyDynamicPrompt(ctx: SystemContext): Promise<string> {
  const parts = [
    `## 当前系统状态`,
    `当前时间：${formatDatetime(new Date())}`,
    ctx.runningApps.length > 0
      ? `运行中的 App：${ctx.runningApps.map(a => a.name).join('、')}`
      : '当前没有运行中的 App',
    ctx.focusedApp
      ? `当前聚焦：${ctx.focusedApp.name}`
      : null,
    ctx.accessibleNamespaces.length > 0
      ? [`\n## 你可以访问的数据`, ...ctx.accessibleNamespaces.map(ns =>
          ` - ${ns.namespace}：${ns.description}`
        )].join('\n')
      : '用户尚未授权任何数据访问权限',
  ]
  return parts.filter(Boolean).join('\n')
}

// 每轮对话注入（走 system-reminder，不修改 system prompt）
export function buildTurnReminder(ctx: SystemContext): string {
  return `<system-reminder>
时间：${formatDatetime(new Date())}
聚焦 App：${ctx.focusedApp?.name ?? '无'}
</system-reminder>`
}
```

---

## 十、关键原则总结

| 原则 | Claude Code 的做法 | Vidorra Buddy 的应用 |
|------|-------------------|---------------------|
| 静态/动态分离 | `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` | 身份/规则静态，系统状态动态 |
| Section 级缓存 | `systemPromptSection` vs `DANGEROUS_uncached` | 用户偏好缓存，运行状态每次重算 |
| 工具描述精确 | 每个工具有明确边界和限制说明 | 工具描述说清楚能做什么、不能做什么 |
| 条件注入 | 按 feature flag 和工具可用性裁剪 | 按授权数据和运行状态裁剪 |
| system-reminder | 动态内容走 user message，不改 system prompt | 每轮注入当前时间和聚焦 App |
| 可逆性原则 | 按操作风险分级，高风险先确认 | 查询免确认，写入必确认 |
| 结构化写法 | `# Section` + bullet list | 同样的结构，便于维护和 A/B 测试 |
