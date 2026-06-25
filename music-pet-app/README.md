# 在听 · 音乐宠物（Music Pet）

> 基于 QQ 音乐产品语境的 **AI 拍照推荐歌曲 + 音乐宠物陪伴** 功能高保真原型。
> 纯前端实现，内置 iPhone 设备模拟器，13 个可交互页面，奶油薄荷绿黏土拟态视觉风格。

本仓库是一份**可点击、可演示**的交互原型（非生产应用），用于呈现「在听」功能从拍照、AI 分析、歌曲推荐，到音乐宠物、音乐日记、社交分享的完整体验闭环。产品设计与定位见 [DESIGN.md](DESIGN.md)。

---

## ✨ 功能概览

| 模块 | 说明 |
| --- | --- |
| **AI 拍照推荐** | 上传/拍摄场景照 → AI 分析中动画 → 多模态识别情绪氛围 → 歌曲推荐 |
| **场景选择** | 5 种心情（放空/专注/提神/陪伴/释放）切换专属场景卡组 |
| **为你推荐** | 情绪转盘、心情 chips、推荐歌单 |
| **在线听播放页** | 模拟播放引擎（进度、播放/暂停、上下首） |
| **音乐宠物陪伴** | 宠物形象、皮肤装扮、互动动作、亲密度等级 |
| **音乐日记** | 流式创作表单（心情文本 + 照片 + 情绪/风格选择 + 高级选项）+ 日历回顾 |
| **社交分享 / 社区** | 公开日记信息流（点赞/评论/转发） |
| **我的档案** | 本月数据、偏好标签、成就徽章、最近在听 |
| **每日任务** | 任务清单、完成解锁装扮、进度持久化 |

完整产品说明（定位、为什么这样设计、视觉语言）见 **[DESIGN.md](DESIGN.md)**。

---

## 🚀 本地运行

无需安装依赖、无需构建步骤。只需 Node.js（建议 ≥ 18，本机使用 v24）：

```bash
# 在项目根目录
node dev-server.mjs
# 然后浏览器打开 http://127.0.0.1:4173
```

自定义端口：

```bash
PORT=8080 node dev-server.mjs        # macOS / Linux
$env:PORT=8080; node dev-server.mjs  # Windows PowerShell
```

> 也可直接用任意静态服务器托管根目录（`index.html` 为入口）。由于使用了 `<script type="module">`，**请勿用 `file://` 直接双击打开**，需经 HTTP 服务。

`.claude/launch.json` 已预置 `node-dev-server` 配置，供预览工具一键启动。

---

## 🗂 项目结构

```
music-pet-app/
├─ index.html        # 入口：设备模拟器外壳 + 控制面板，挂载 app.js
├─ app.js            # 全部 UI 逻辑（~1300 行）：视图渲染 + 路由 + 状态 + 交互
├─ styles.css        # 全部样式（~4400 行）：:root 设计令牌 + 各页面/组件
├─ api.js            # 独立的 Mock 数据 / 接口契约模块（端点 + 示例数据）
├─ dev-server.mjs    # 零依赖静态文件服务器（Node 原生 http）
├─ DESIGN.md         # 产品设计说明 + 设计系统规范
├─ render.html       # 渲染测试用 harness
├─ smoke_test.mjs    # 静态冒烟测试（断言关键标记存在）
└─ picture/          # 图标、插画、宠物素材（按功能分子目录）
   ├─ Icon/ Logo/ Mascot small/ Mini Player/ Playlist/ ...
```

---

## 🧱 技术架构

纯 **原生 JS / HTML / CSS**，无框架、无打包工具、无运行时依赖。

- **视图与路由**：`views` 对象把视图键映射到 13 个 `render*()` 函数，每个函数返回 HTML 字符串，通过 `innerHTML` 整屏替换。
  ```
  home · scene · analyze · results · recwheel · player
  diary · diarylog · profile · petskin · tasks · community · video
  ```
- **历史栈导航**：`state.history` 入/出栈，`data-nav="back"` 返回；`state.navDir` 驱动方向感知的转场动画（前进/后退/淡入）。
- **集中式状态**：单一 `state` 对象（当前视图、宠物 Tab、场景心情、日记选择、任务完成、播放器等）。
- **事件委托**：document 级单一点击处理器，靠 `data-*` 属性分发：
  `data-nav`（跳转）、`data-toast`（提示）、`data-task`（勾选任务）、`data-toggle`（开关）、`data-pettab` / `data-scenemood` / `data-emotion` / `data-style` / `data-skin` / `data-act`（各页选择态）、`data-action`（设备控制）。
- **数据驱动**：页面内容由数组 `.map()` 渲染（`SCENE_DATA` / `REC_SONGS` / `FEED` / `EMOTIONS` / `STYLES` / `TASKS` / `PF_ACH` / `VIDEOS` …），便于扩充。
- **持久化**：`localStorage`（键 `"mpet"`）保存 `taskDone / diaryPublic / petTab / skinSel / sceneMood`，刷新/演示可续；隐私模式异常被静默忽略。
- **模拟播放引擎**：仅在播放页用可暂停的 `setInterval` 推进进度，离开即清除（**不使用常驻 requestAnimationFrame**）。

### 数据层（`api.js`）

`api.js` 是一份**接口契约 + Mock 数据**模块：定义了 `/api/music-pet/*` 端点结构和示例歌曲/场景/日记数据，作为未来对接真实后端的参考。当前原型 `app.js` 直接使用内联数据数组渲染，二者数据语义一致。

---

## 🎨 设计系统

**奶油薄荷绿黏土拟态（Cream-Mint Claymorphism）**：圆胖卡片、多层黏土阴影（外阴影 + 白色高光）、非纯白奶油底、Nunito 圆体标题、薄荷绿品牌强调色 + 粉彩点缀、按压弹性反馈、漂浮 blob。

完整设计令牌（字号层级、颜色、圆角/阴影、动效、黏土配方、响应式宽度约定）见 **[DESIGN.md](DESIGN.md) → 设计系统规范**。

### 关键工程约束

> 来自项目实践经验，修改样式/动画时请遵守：

- ❌ **不使用 `backdrop-filter: blur()`** —— 会导致无头预览截图工具挂起；毛玻璃用近不透明奶油底 + 阴影替代。
- ❌ **不使用常驻 `requestAnimationFrame`** —— 动画一律用 CSS `@keyframes` 或可暂停 `setInterval`。
- ❌ **避免多 MB 大图** 作为持续动画层。
- ✅ 满铺容器/底栏用 `width: var(--screen-w)` 等响应式宽度，**不写死 `393px`**，以适配不同设备（iPhone 16 / 16 Pro 屏宽不同）。
- ✅ 全局已加 `prefers-reduced-motion` 降级。

---

## 📱 设备模拟器

左侧控制面板可切换设备并调节显示：

- **设备**：iPhone 14（390×844）/ 15（393×852）/ 16（393×852）/ 16 Pro（402×874）
- **亮度**：30%–100%（CSS `filter: brightness`）
- **缩放**：50%–150%
- **旋转 / 重置**

设备尺寸通过 CSS 变量 `--screen-w` / `--screen-h` 注入，布局以 **393px 逻辑宽**为设计基准，并通过响应式宽度自适应更宽的机型。

---

## ✅ 验证

```bash
node smoke_test.mjs   # 静态断言：关键标记 / 设备规格 / 视图存在
```

交互与视觉建议在浏览器中走查：首页 → 各分支 → 返回，确认历史栈无回环、固定层（导航/迷你播放器）不闪、各页选择态生效。

---

## 📄 相关文档

- **[DESIGN.md](DESIGN.md)** —— 产品定位、核心功能、视觉语言、完整设计系统规范。

---

## 工程化扩展：音乐养成后端

当前版本已经从纯前端原型扩展为“前端高保真体验 + 轻量后端推荐管线”。前端仍保留原有 QQ 音乐风格、宠物素材、换装素材和页面结构，新增能力通过 `/api/music-pet/*` 接口接入。

### AI Pipeline

`POST /api/music-pet/recommendation` 会执行：

```text
VisionAnalyzer -> AIMusicIntent -> CandidateRecall -> AIReranker -> PersonaAgent -> PetGrowthAgent
```

响应包含多模态场景/情绪分析、音乐意图标签、BPM 区间、推荐歌曲、宠物心情、动作、装扮、律动动画、成长值、推荐理由和宠物人格回复。

### Kimi / LLM

本地 `.env` 支持以下配置，密钥只放后端，不提交到仓库：

```text
KIMI_API_KEY
KIMI_BASE_URL
KIMI_VISION_MODEL
KIMI_TEXT_MODEL
LLM_API_KEY
LLM_BASE_URL
LLM_TEXT_MODEL
```

没有模型密钥时，系统会自动回退到本地规则文案，保证演示可运行。

### 音乐源

当前试听源优先级：

```text
MUSIC_PROVIDER_URL -> iTunes Search -> Deezer Search -> SQLite songs/song_features -> JS demo catalog
```

公开音乐源主要用于演示 30 秒试听、封面、歌手、专辑和外部链接。完整商业播放仍需要接入有版权授权的音乐平台或内部曲库。

### 数据库与状态

状态和本地歌库是 SQLite-first：

```text
users
pets
pet_inventory
listening_events
recommendation_records
songs
song_features
```

默认数据库路径：

```text
~/Documents/腾讯AI/music-pet.sqlite
```

可通过 `.env` 覆盖：

```text
MUSIC_PET_DB_PATH=C:\path\to\music-pet.sqlite
PYTHON_PATH=C:\path\to\python.exe
DISABLE_SQLITE=0
```

### 视频律动

`POST /api/music-pet/video-rhythm` 接收轻量视频特征：

```json
{
  "durationSec": 12,
  "sampleRate": 6,
  "motionSeries": [0.12, 0.7, 0.18, 0.75],
  "audioEnergySeries": [0.1, 0.86, 0.16, 0.82],
  "brightnessSeries": [0.5, 0.56, 0.52, 0.58]
}
```

返回 `rhythmType`、`frontendMode`、`actionId`、`petImg`、`bpm`、`rhythmProfile`、`musicIntent`、`petDirective`，可驱动播放页小精灵随节奏摇摆。

### 运行与检查

```bash
npm run dev
npm run check
npm run smoke
```
