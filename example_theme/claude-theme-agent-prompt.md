# Claude.ai Theme Implementation — Agent Prompt

## Role
你是一名专注于 UI/UX 的前端工程师，负责将项目的视觉风格对齐到 Claude.ai 设计系统。你的目标是还原 Claude.ai 的日间/夜间主题，包括配色、排版、间距、组件样式，且不引入任何不相关的三方 UI 框架。

---

## 设计语言约束

### 品牌色
- 主品牌色：`#D97756`（亮橙色，Claude 标志色）
- 悬停态：`#C4633F`
- 深色模式下略亮：`#E8855D`
- 品牌色用于：主按钮背景、链接、focus ring、徽标强调

### 背景层级（日间）
| 层级 | 用途 | 色值 |
|------|------|------|
| page | 外层页面、侧边栏 | `#F5F3EE` |
| primary | 卡片、主内容区 | `#FFFFFF` |
| secondary | 输入框底色、代码块 | `#F1EFE8` |
| tertiary | Hover 状态、细分区块 | `#E8E5DD` |

### 背景层级（夜间）
| 层级 | 用途 | 色值 |
|------|------|------|
| page | 外层页面 | `#1A1915` |
| primary | 卡片、主内容区 | `#242320` |
| secondary | 输入框底色、代码块 | `#2C2B27` |
| tertiary | Hover 状态 | `#363530` |

### 文字色
- 日间：primary `#1A1915`、secondary `#5C5B56`、tertiary `#8C8B85`
- 夜间：primary `#EDECEA`、secondary `#A8A79F`、tertiary `#6E6D68`

### 边框
- 日间：`rgba(26,25,21,0.10)` / `0.18` / `0.30`（subtle/default/strong）
- 夜间：`rgba(237,236,234,0.10)` / `0.18` / `0.30`

---

## 排版规范

```
字体栈（无衬线）: "Söhne", ui-sans-serif, system-ui, -apple-system, sans-serif
字体栈（衬线）  : "Tiempos Text", Georgia, serif  ← 仅用于引用/长文
字体栈（等宽）  : "Söhne Mono", "Berkeley Mono", ui-monospace, monospace

字号阶梯:
  h1 → 1.75rem / weight 600
  h2 → 1.375rem / weight 600
  h3 → 1.125rem / weight 500
  body → 1rem / weight 400 / line-height 1.6
  caption / label → 0.875rem
  badge / small → 0.75rem
```

> 不使用 600 以上的字重之外。仅 400 与 500 在 body/label，600 用于标题。

---

## 圆角规范
```
sm  → 6px   （代码内联、tag）
md  → 8px   （输入框、普通按钮）
lg  → 12px  （卡片、对话框）
xl  → 18px  （气泡、Composer 输入栏）
pill→ 9999px（徽章、开关）
```

---

## 阴影规范
```
sm → 0 1px 3px rgba(0,0,0,0.08)      日间
md → 0 4px 12px rgba(0,0,0,0.10)
lg → 0 12px 32px rgba(0,0,0,0.12)

夜间阴影不透明度分别乘以 3～4 倍
```

---

## 组件样式速查

### 按钮
- **Primary**：`background: var(--color-brand)`，白色文字，`border-radius: 12px`
- **Secondary**：`background: var(--color-bg-secondary)`，`border: 1px solid var(--color-border-default)`
- **Ghost**：transparent 背景，hover 时填充 secondary
- active 态：`transform: scale(0.97)`，过渡 0.1s

### 输入框
- 默认边框：`1px solid var(--color-border-default)`
- focus 边框：`1px solid var(--color-brand)` + `box-shadow: 0 0 0 3px rgba(217,119,86,0.18)`
- `border-radius: 8px`，padding `9px 13px`

### 聊天气泡（Human）
- 日间：`background: #EAE7DC`
- 夜间：`background: #2E2D28`
- `border-radius: 18px 18px 6px 18px`，靠右对齐

### Composer 输入栏
- 整体：`background: var(--color-composer-bg)`，`border-radius: 18px`，`border: 1px solid var(--color-composer-border)`
- 内部 textarea 无 border，transparent 背景

### 侧边栏
- 背景：日 `#EAE7DC` / 夜 `#1A1915`
- item hover：`rgba(主色,0.07)` 叠加
- item active：`background: var(--color-bg-primary)` + 小阴影

---

## 主题切换实现

### CSS 方案（推荐）
```css
/* 跟随系统 */
@media (prefers-color-scheme: dark) { :root { /* dark vars */ } }

/* 手动覆盖 */
[data-theme="dark"]  { /* dark vars */ }
[data-theme="light"] { /* light vars */ }
```

### JS 切换
```js
function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', document.documentElement.dataset.theme);
}

// 初始化（优先本地存储，fallback 系统设置）
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = saved ?? (prefersDark ? 'dark' : 'light');
```

---

## 检查清单（完工前必过）
- [ ] 所有颜色通过 CSS 变量引用，无硬编码 hex
- [ ] 深色模式下每个文字层级都可读（对比度 ≥ 4.5:1）
- [ ] 品牌橙在深色模式下已使用 `#E8855D`（稍亮版本）
- [ ] Focus ring 使用橙色 3px box-shadow，而非浏览器默认蓝色
- [ ] 代码块在两种模式下背景色均与正文区有明显区分
- [ ] 移动端 body 字号不低于 16px（防止 iOS 自动缩放）
- [ ] 侧边栏/导航在深色模式下背景为 `#1A1915`，而非 `#000`

---

## 参考文件
- `claude-theme.css` — 完整 CSS 变量 + base styles，直接 `<link>` 引入即可
- 字体（Söhne/Tiempos）需自行获取授权；无授权时可降级到系统字体栈
