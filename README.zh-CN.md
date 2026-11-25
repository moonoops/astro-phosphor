# Astro Phosphor

[English](./README.md) | **简体中文**

一个轻量、**100% 纯静态**的 1990 年代米色 CRT 显示器 × 单色荧光管复古桌面个人站模板，基于 **Astro 5**、**React 19** 与 **Tailwind CSS v4** 构建。

零后端依赖、零数据库、零外部图标库——完整内置单色相数学衍生设计系统、交互式 Design System 标本页、支持中英 CJK 排版的 MDX 博客、5 款纯前端离线复古小游戏，以及面向 AI 编程的 `AGENTS.md`、`docs/DESIGN.md` 和**自定义桌面背景图 Agent Skill**。

---

## 核心特性

- **1990 年代复古书桌 + 五时段自然光影**：根据访客本地时间自动切换 5 套 Macintosh LC 书桌光影（`morning` / `noon` / `afternoon` / `dusk` / `night`），支持平滑淡入过渡，窄屏与移动端自动降级为同色系氛围窄边框。
- **三态镜头控制与真实 CRT 光学层**：基于 CSS `@property` 的丝滑过渡，支持 **Room（远景）**、**Close（近景）** 和无边框 **Fullscreen（全屏）**（快捷键 `+` / `-` / `F`），内置渐进式曲屏滤镜与指针反投影、扫描线、暗角、荧光泛光、窗光反射以及开关机显像管点火/坍缩动画。
- **单色相数学衍生设计系统**：只需更改一个 `--lit` 变量，即可同步重绘全站文字、边框、3D 像素按键、荧光晕、Shiki 代码块、Canvas 小游戏与动态 SVG 像素光标。内置 4 套主题（琥珀 `amber` / 翠绿 `green` / 冰蓝 `blue` / 纸白 `white`）与一键 **Reading Mode（阅读模式）**。
- **Astro 静态核心 + 持久化 OS 外壳**：使用 `<ClientRouter />` 与 `transition:persist`，切换窗口路由时绝不重播暖机模糊或丢失缩放状态。
- **中英双语 MDX 博客与 CJK 排版优化**：内置分类/标签/关键词实时检索、左侧吸顶目录（Scrollspy TOC）、单色 Shiki 代码块；在文章 frontmatter 设置 `lang: zh-CN` 自动启用 `1.75` 中文行高与收敛标题字阶。
- **5 款 100% 离线复古小游戏**：扫雷、俄罗斯方块、贪吃蛇、2048、21 层魔塔（`Magic Tower · 魔塔 21F`）——纯 TypeScript + Canvas + Web Audio 合成 8-bit 音效 + `localStorage` 本地纪录与多槽位存档。
- **AI 友好、开箱即二开**：随仓附带精炼版 [`AGENTS.md`](./AGENTS.md)、[`docs/DESIGN.md`](./docs/DESIGN.md) 与 [`crt-room-artwork`](./.agents/skills/crt-room-artwork/SKILL.md) Agent Skill，交给任何 AI 编程助手都能严格遵循像素与单色相规范扩展新窗口或更换定制机箱背景。

---

## 页面清单

| 路由 | 说明 |
| :--- | :--- |
| `/` | 复古桌面首页（6 枚对称快捷图标、`TypedText` 欢迎语、大号像素壁纸标题） |
| `/work` 与 `/work/[slug]` | 精选作品集网格 + 案例详情子窗口 + 真彩全屏灯箱（`GalleryLightbox`） |
| `/journal` 与 `/journal/[slug]` | 纯静态 MDX 博客，支持搜索/分类/标签过滤、目录追踪与阅读模式 |
| `/about` | 个人简介、像素头像、规格表、工作流向导（`SetupWizard`）、时间线与 `FAQPanel` |
| `/contact` | 复古邮件客户端表单（配置邮箱后唤起 `mailto:`，未配置自动下载本地 `.txt` 草稿） |
| `/design-system` | 实时交互式设计系统标本页（切换主题/阅读模式，预览全部令牌、字阶、按键、图标与组件） |
| `/games` | 离线街机中心，内置扫雷、俄罗斯方块、贪吃蛇、2048、魔塔 21F |
| `/404` | 经典复古报错小弹窗 |

---

## 快速开始

环境要求：**Node.js `^20.19.0` 或 `>= 22.12.0`**。

```sh
npm install
npm run dev
```

打开 `http://localhost:4321` 即可预览。

### 常用命令

```sh
npm run check         # 运行 Astro 诊断与 TypeScript 严格类型检查
npm run build         # 构建 100% 静态产物至 dist/
npm run preview       # 本地预览 dist/ 构建结果
npm run art:room      # 将自定义五时段桌面原图压缩为响应式 WebP
npm run test:browser  # 运行 Playwright 浏览器自动化测试（需本机安装 Chrome）
```

---

## 个性化定制指南

1. **站点名称与社交链接**：修改 [`src/site.ts`](./src/site.ts) 与 [`src/data/page-copy.json`](./src/data/page-copy.json)。
2. **作品集内容**：编辑或替换 [`src/content/projects/`](./src/content/projects/) 中的 `.mdx` 文件，配图放在 `public/media/work/`。
3. **撰写文章**：在 [`src/content/journal/`](./src/content/journal/) 新建 `.mdx` 文件；中文长文在 frontmatter 中填写 `lang: zh-CN`，草稿可设 `draft: true`。
4. **邮箱与线上域名**：复制 `.env.example` 为 `.env`：
   - 填写 `PUBLIC_CONTACT_EMAIL` 开启联系页 `mailto:` 唤起（留空则自动切换为本地草稿下载）。
   - 构建前设置 `SITE_URL` 以生成规范的 Canonical 与 OpenGraph 社交预览链接。
5. **预览五时段光影**：在任意页面 URL 后加上 `?scene=morning` / `noon` / `afternoon` / `dusk` / `night` 即可切换场景。

---

## 自定义 CRT 桌面背景图（内置 Agent Skill）

想把默认的 Macintosh LC 换成你喜欢的 Sony Trinitron、IBM PS/2、复古 ThinkPad 或自定义书桌场景？

项目内置了标准化的 Agent Skill：[`.agents/skills/crt-room-artwork/SKILL.md`](./.agents/skills/crt-room-artwork/SKILL.md)。直接让你的 AI 助手（Antigravity / Claude Code / Codex / Cursor 等）读取该 Skill，即可按标准流程完成：

1. 生成严格 16:9 正视角、带纯黑 4:3 玻璃开口的复古显示器底图
2. 生成像素级对齐的五时段光照变体（晨/午/下午/黄昏/夜）
3. 执行 `npm run art:room` 自动导出轻量化响应式 WebP
4. 精确校准 `src/geometry/tube.ts`、`src/geometry/room-crop.js` 中的屏幕开口、指示灯坐标与 `src/styles/room-scenes.css` 氛围色

---

## 静态部署

项目默认输出纯静态文件（`dist/`），零服务器成本：

- **Cloudflare Pages / Vercel / Netlify**：直接关联仓库，构建命令填 `npm run build`，输出目录填 `dist`。
- **GitHub Pages**：通过 GitHub Actions 发布 `dist/`，并在构建环境变量中传入 `SITE_URL`。

将托管平台的 404 页面指向 `dist/404.html`，即可自动展示复古报错弹窗。

---

## 致谢与开源协议

- 视觉美学灵感致谢 *Nostalgia Computer*；本仓库所有代码、像素图标、CRT 光学层与五时段 Macintosh LC 书桌摄影均为独立编写/生成。
- *魔塔 21F* 玩法致谢经典开源项目 `ckcz123/mota-js`，底层引擎与单色像素精灵图均使用 TypeScript 与 Canvas 独立重制。
- 字体：通过 Fontsource 自托管 *Jersey 10* 与 *Chivo Mono*。

基于 [MIT License](./LICENSE) 开源。
