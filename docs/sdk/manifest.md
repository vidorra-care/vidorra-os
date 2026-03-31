# manifest.json 规范

完整字段定义和示例。

---

## 完整示例

```json
{
  "id": "com.yourname.budget",
  "name": "记账本",
  "version": "1.2.0",
  "entry": "https://budget.yourapp.dev",
  "icon": "./icon.svg",
  "category": "finance",
  "description": "简洁的个人收支记录工具",
  "defaultSize": { "width": 900, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "permissions": [
    "datastore.read:com.yourname.budget:transactions",
    "datastore.write:com.yourname.budget:transactions",
    "datastore.read:com.global:categories",
    "notifications.send",
    "filesystem.read"
  ],
  "spotlightActions": [
    { "keyword": "新增收支", "action": "open?modal=new-entry" },
    { "keyword": "查看账单", "action": "open?view=monthly" }
  ],
  "menubar": {
    "文件": [
      { "label": "新建记录", "action": "new-entry", "shortcut": "CmdOrCtrl+N" },
      { "type": "separator" },
      { "label": "导出 CSV", "action": "export-csv" },
      { "label": "导出 PDF", "action": "export-pdf" }
    ],
    "视图": [
      { "label": "月视图", "action": "view-monthly", "shortcut": "CmdOrCtrl+1" },
      { "label": "年视图", "action": "view-yearly", "shortcut": "CmdOrCtrl+2" }
    ]
  },
  "exposes": {
    "transactions": {
      "description": "用户的所有收支记录",
      "schema": "./schemas/transaction.json"
    }
  }
}
```

带公开分享的 App（如博客）额外声明 `standalone` 字段：

```json
{
  "id": "com.yourname.blog",
  "name": "博客",
  "standalone": {
    "slug": "blog",
    "routes": [
      { "path": "/",            "entry": "./public/index.html" },
      { "path": "/posts/:slug", "entry": "./public/post.html" }
    ],
    "publicNamespaces": [
      {
        "namespace": "com.yourname.blog:posts",
        "filter": { "published": true }
      }
    ]
  }
}
```

访客访问 `https://your-server.com/app/blog/posts/hello-world` 时，加载 `post.html`，Server 只返回 `published: true` 的文章数据。

---

## 字段详解

### `id` — 必填

反向域名格式，全局唯一。一旦发布不可更改。

```
com.yourname.appname
```

### `category` — 必填

可选值：`productivity` | `finance` | `entertainment` | `developer` | `utility`

### `permissions` — 可选

权限字符串格式：

```
datastore.read:<namespace>     读取指定命名空间
datastore.write:<namespace>    写入指定命名空间
notifications.send             发送系统通知
filesystem.read                读取共享文件系统
filesystem.write               写入共享文件系统
```

命名空间格式：`appId:collection` 或 `com.global:collection`

### `spotlightActions` — 可选

用户在 Spotlight 输入 keyword 时，显示该 App 的快捷动作。`action` 字段会作为参数传给 `spotlight:action` 事件。

### `menubar` — 可选

当该 App 聚焦时，Menubar 显示这里定义的菜单项。菜单项点击后，通过 `menu:action` 事件通知 App。

### `exposes` — 可选

声明该 App 对外暴露的数据 schema。其他 App 在声明 `datastore.read` 权限时，可以看到这里的描述，帮助用户理解授权内容。

---

## 最简 manifest

只需一个 URL 也可以运行，无需任何 SDK：

```json
{
  "id": "com.yourname.hello",
  "name": "Hello World",
  "version": "1.0.0",
  "entry": "https://hello.yourapp.dev",
  "icon": "./icon.svg",
  "category": "utility",
  "defaultSize": { "width": 600, "height": 400 },
  "minSize": { "width": 300, "height": 200 }
}
```
