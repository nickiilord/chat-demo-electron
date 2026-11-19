# Yixu（一叙）桌面版

这是 chat-demo 的 Electron 桌面封装。界面和聊天功能与网页版保持一致，会话与附件仍由原项目的 IndexedDB 存储保存，桌面版只是把它们放进 Electron 的应用数据目录，并补上窗口、菜单、系统浏览器打开外链等桌面能力。

最新版本和安装包见 [Releases](https://github.com/nickiilord/chat-demo-electron/releases)。

## 下载与安装

发布产物由 GitHub Actions 构建，命名如下：

- Windows：`Yixu-<version>-win-x64.exe`（NSIS 安装包）
- macOS：`Yixu-<version>-mac-arm64.dmg`、`Yixu-<version>-mac-x64.dmg`
- Linux：`Yixu-<version>-linux-x86_64.AppImage`

首次打开后，在设置里填入 DeepSeek API Key 即可开始对话。

## 数据位置

桌面版使用 Electron 的 userData 目录保存 IndexedDB、localStorage（API Key 和界面设置）等数据：

- Windows：`%APPDATA%\yixu`
- macOS：`~/Library/Application Support/yixu`
- Linux：`~/.config/yixu`

设置里的导入、导出功能仍然可用，导出的 ZIP 与网页版格式相同，可以在网页版和桌面版之间迁移会话。

## 更换 API 服务

默认使用“官方服务”，即 `https://api.deepseek.com` 和默认模型 `deepseek-flash`。打开“设置 → 数据管理 → API 设置”，可以切换到“自定义服务”，这时会出现两个输入框：

- API 地址：第三方中转或自建网关的地址，支持 `http://` 和 `https://`，可以带子路径。
- 模型：该服务使用的模型名，默认填入 `deepseek-flash`，可以改成供应商要求的名字。

保存后立即生效。切换官方或自定义服务后，之前保存的 API Key 属于旧服务，需要重新填写。官方服务固定使用默认模型，只有自定义服务会使用填写的模型。

### 需要兼容的接口

chat-demo 不是通用的 OpenAI 兼容客户端，它使用 DeepSeek 的 Anthropic 兼容接口和 DeepSeek 自己的扩展字段。第三方端点必须兼容下面这些请求，否则会出现请求失败或部分功能不可用。

| 用途 | 请求 | 要求 |
| --- | --- | --- |
| 校验 API Key | `GET {base}/models` | 使用 `Authorization: Bearer`。服务没有这个接口时，保存 API Key 会跳过校验直接保存。 |
| 对话 | `POST {base}/anthropic/v1/messages` | Anthropic Messages API 格式，请求体带 `stream: true`；响应必须是 SSE 事件流，包含 `message_start`、`content_block_start`、`content_block_delta`、`content_block_stop`、`message_stop`、`error` 等事件。 |
| 上传附件 | `POST {base}/anthropic/v1/files` | `multipart/form-data`，响应需要包含文件 `id`；请求头会带 `anthropic-beta: files-api-2025-04-14`。 |
| 删除附件 | `DELETE {base}/anthropic/v1/files/{id}` | 代码里定义了该请求，当前版本不会主动调用。 |
| 语音识别 | `POST {base}/v1/tools/asr` | multipart 上传音频，响应 `{ "text": "..." }`。 |
| 语音朗读 | `POST {base}/v1/tools/tts` | JSON 请求，响应为 24kHz、单声道、16-bit 小端裸 PCM 字节流。 |

请求体里还会出现 DeepSeek 特有的字段和值：

- `model`：由“模型”设置决定，官方服务固定为 `deepseek-flash`。
- `thinking: { type: "enabled" | "disabled" }`：深度思考。
- `safety_check: { level: "high" }`：安全审核。
- `tools` 中的 `deepseek_web_search`（智能搜索）和 `deepseek_read_url`（链接阅读）。
- `messages` 中 `role: "latest_reminder"` 的扩展消息。

如果第三方服务不认识这些字段，常见表现是返回 400、忽略搜索和深度思考，或者直接报错。接入前请向供应商确认它支持 DeepSeek 的 Anthropic 兼容接口，而不只是通用的 Anthropic 或 OpenAI 接口。

### 跨域要求

桌面版用 `file://` 加载页面，请求的 `Origin` 是 `null`。API 服务需要允许这个来源，也就是响应里返回 `Access-Control-Allow-Origin: null` 或 `*`，并且预检请求允许 `x-api-key`、`anthropic-beta`、`content-type` 等请求头。否则请求会在浏览器安全策略这一层被拦截，界面表现为网络错误。

## 开发

需要 Node.js 22.12+ 和 pnpm。

```sh
pnpm install
pnpm dev:desktop
```

`dev:desktop` 会启动 rspack 开发服务器，再启动 Electron 加载开发页面。修改渲染层代码后刷新窗口即可，修改主进程代码需要重新运行。

常用命令：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev:desktop` | 开发模式启动桌面应用 |
| `pnpm build:desktop` | 构建渲染层和主进程 |
| `pnpm start` | 用已构建的产物启动桌面应用 |
| `pnpm type` / `pnpm type:electron` | 检查渲染层 / 主进程类型 |
| `pnpm dist:win` | 打包 Windows 安装包 |
| `pnpm dist:mac` | 打包 macOS 安装包 |
| `pnpm dist:linux` | 打包 Linux AppImage |
| `pnpm pack:dir` | 只生成解包目录，便于检查产物 |

构建输出：

- `dist/`：渲染层静态文件，由 rspack 生成
- `electron-dist/main.cjs`：Electron 主进程，由 esbuild 打包成单文件
- `release/`：electron-builder 生成的安装包

## 打包精简

安装包只包含运行必需的文件：

- 打包内容只有 `dist`、`electron-dist`、`package.json` 和 `LICENSE`，不包含 `node_modules`。
- Electron 只保留 `en-US`、`zh-CN` 两种语言资源，其余 locale 不参与打包。
- 使用 asar 归档和 maximum 压缩。
- 主进程不依赖第三方运行时模块，渲染层依赖已经全部打进 `dist`。

## 发布

推送 `v*` 标签会触发 `.github/workflows/release.yml`，在 Windows、macOS（x64 和 arm64）和 Linux 上分别构建，并把安装包附加到对应的 GitHub Release：

```sh
git tag v0.2.0
git push origin v0.2.0
```

也可以在仓库的 Actions 页面手动运行 `Build desktop releases`，此时产物只作为 workflow artifact 保留，不会创建 Release。

## 签名说明

仓库没有配置代码签名证书，发布产物是未签名的：

- Windows：SmartScreen 可能提示“未知发布者”，选择“更多信息”后仍可运行。
- macOS：首次打开需要右键应用，选择“打开”；如果提示应用已损坏，可在终端执行 `xattr -dr com.apple.quarantine "/Applications/Yixu.app"`。未签名时系统可能拒绝授予麦克风权限，语音输入需要配置 Apple 开发证书签名后才能正常使用。
- Linux：AppImage 下载后需要 `chmod +x` 再运行。

## 安全边界

- 渲染进程关闭 Node.js 集成，启用 contextIsolation 和沙箱。
- 外部链接交给系统浏览器打开，应用内不允许导航到其他页面或打开新窗口。
- 只授予麦克风（语音输入）、剪贴板写入和全屏权限，其余权限请求拒绝。
- 导出历史 ZIP 时使用系统保存对话框。
