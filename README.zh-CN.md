# chat-demo

[English](README.md) | 简体中文

基于 DeepSeek API 的静态聊天示例。无需应用后端，浏览器直接请求配置的 API 服务。

这个 fork 在网页版基础上增加了跨平台的 Electron 桌面应用“一叙（Yixu）”，安装包发布在 [Releases](https://github.com/nickiilord/chat-demo-electron/releases)。

## 桌面版（一叙）

- 提供 Windows x64 安装包、macOS DMG（arm64 和 x64）以及 Linux AppImage。
- 界面和聊天行为与网页版一致，会话、附件、API Key 和设置仍使用原来的 IndexedDB 与 localStorage。
- 设置 → 数据管理 → API 设置可以在官方服务和自定义服务之间切换；自定义服务可以填写兼容的服务地址和模型名。默认使用官方服务和 `deepseek-flash`。
- 打包只包含 `dist`、`electron-dist`、`package.json` 和 `LICENSE`，不包含 `node_modules`；只保留 `en-US` 和 `zh-CN` 两种 Electron 语言资源，使用 asar 和 maximum 压缩。
- 桌面版的构建命令、数据位置和第三方 API 协议要求见 [README.desktop.md](README.desktop.md)。

## 运行

准备 Node.js 22.12+ 和 pnpm：

```sh
git clone https://github.com/nickiilord/chat-demo-electron.git
cd chat-demo-electron
pnpm install
pnpm dev
```

打开 http://localhost:8090 。

生成静态产物：

```sh
pnpm build
```

产物位于 `dist/`，可部署到静态服务器，也可直接打开 `dist/index.html`。直接打开时，浏览器和 API 服务需允许 `file://` 页面的存储与跨域请求。

开发桌面版：

```sh
pnpm dev:desktop
```

构建并打包桌面版：

```sh
pnpm build:desktop
pnpm dist:win   # 在对应平台上使用 dist:mac 或 dist:linux
```

## 功能

- 多会话、自动标题、重命名与删除；编辑提问、重新生成和切换消息分支。
- 流式回答、深度思考、智能搜索、链接阅读与来源引用；支持停止和符合条件的继续生成。
- 附件上传、粘贴与拖拽，语音输入和回复朗读；移动端录音时输入框首行显示实时频谱。
- Markdown、代码高亮、KaTeX 公式和 Mermaid 图表。
- 简体中文与英文、浅色与深色主题、移动端布局、位置设置、历史导入导出。
- 桌面版支持窗口尺寸记忆、系统浏览器打开外链、下载保存对话框、麦克风权限处理，Windows 和 Linux 默认隐藏菜单栏。
- 支持在官方服务和第三方 DeepSeek 兼容服务之间切换，并可配置自定义模型名。

## 数据

API Key 和设置保存在浏览器 localStorage，会话及附件原件保存在 IndexedDB，本地数据按浏览器用户配置和站点源（origin）隔离。发送对话、上传附件和使用语音功能时，相应内容会提交给配置的 API 服务。

桌面版使用同一套 IndexedDB 和 localStorage，存放在 Electron 的 userData 目录：

- Windows：`%APPDATA%\yixu`
- macOS：`~/Library/Application Support/yixu`
- Linux：`~/.config/yixu`

设置中的历史导入导出使用 ZIP 格式。导入会在确认并校验成功后替换全部本地会话和附件；导出包含会话与本地可用的图片原件，不包含 API Key、设置或非图片附件原件。格式与保留范围见[历史导入导出](src/services/chat/history/README.md)。

设置 → 数据管理 → 删除所有对话，会在确认后清空全部本地会话、附件原件和未发送的草稿，停止正在生成的回复并回到新对话。API Key 和其他设置保留，已上传到 API 服务的文件不受影响。

## 开发

| 命令                 | 用途                       |
| -------------------- | -------------------------- |
| `pnpm dev`           | 启动网页版开发服务器       |
| `pnpm build`         | 构建网页版到 `dist/`       |
| `pnpm type`          | TypeScript 类型检查        |
| `pnpm lint`          | oxlint 检查                |
| `pnpm format`        | oxfmt 格式化               |
| `pnpm dev:desktop`   | 启动 Electron 和开发服务器 |
| `pnpm build:desktop` | 构建渲染层和主进程         |
| `pnpm type:electron` | 检查主进程类型             |
| `pnpm dist:win`      | 打包 Windows 安装包        |
| `pnpm dist:mac`      | 打包 macOS DMG             |
| `pnpm dist:linux`    | 打包 Linux AppImage        |
| `pnpm pack:dir`      | 只生成解包目录             |

[rspack.config.ts](rspack.config.ts) 默认使用 `https://api.deepseek.com`。`createConfig({ apiOrigin, devServer })` 支持自定义构建期默认地址和开发服务器代理；桌面版可以在设置中运行时切换 API 服务。

聊天默认使用 `deepseek-flash`，通过 Anthropic 兼容的 Messages / Files API 通信；语音使用 ASR / TTS 接口。请求使用搜索、链接阅读、标题和 `latest_reminder` 等扩展，接入服务需支持相应能力。附件实际支持的格式以服务端校验为准。

```text
src/
  app/                 应用布局、主题与全局样式
  components/          聊天、设置、Markdown 等界面组件
  i18n/                中英文文案
  services/
    api/               API 请求、SSE 与协议类型
    chat/              会话、消息分支、本地存储与历史导入导出
    markdown/          Markdown 解析、代码高亮与图表
    speech/            录音与朗读
  utils/               通用工具
electron/
  main.ts              Electron 主进程
```

## 上游

本项目基于 [deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo)，网页版保持与上游静态构建兼容。

## 许可证

[MIT](LICENSE)。构建会将许可证复制到 `dist/LICENSE`，分发时请一并保留；第三方依赖遵循各自的许可证。
