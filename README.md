# chat-demo

English | [简体中文](README.zh-CN.md)

A static chat demo powered by the DeepSeek API. No application backend is required: the browser connects directly to the configured API service.

This fork adds a cross-platform Electron desktop app called **Yixu (一叙)**. Installers are published on [Releases](https://github.com/nickiilord/chat-demo-electron/releases).

## Desktop app (Yixu)

- Windows x64 NSIS installer, macOS DMG for arm64 and x64, and Linux AppImage.
- Same chat UI and behavior as the web version. Conversations, attachments, API Key and settings still use the original IndexedDB and localStorage.
- Settings → Data → API configuration lets you use the official DeepSeek service or a custom compatible endpoint with its own model name. The default is the official service with `deepseek-flash`.
- Packaging is intentionally small: only `dist`, `electron-dist`, `package.json` and `LICENSE` are archived, with no `node_modules`, only the `en-US` and `zh-CN` Electron locales, asar and maximum compression.
- Desktop build steps, data locations and third-party API protocol requirements are documented in [README.desktop.md](README.desktop.md).

## Getting started

Install Node.js 22.12+ and pnpm, then run:

```sh
git clone https://github.com/nickiilord/chat-demo-electron.git
cd chat-demo-electron
pnpm install
pnpm dev
```

Open http://localhost:8090.

To build the static site:

```sh
pnpm build
```

The output is written to `dist/`. Deploy it to a static web server or open `dist/index.html` directly. Opening the file directly requires browser support for storage on `file://` pages and an API service that permits their cross-origin requests.

To run the desktop app in development:

```sh
pnpm dev:desktop
```

To build and package the desktop app:

```sh
pnpm build:desktop
pnpm dist:win   # use dist:mac or dist:linux on the matching platform
```

## Features

- Multiple conversations with automatic titles, renaming, and deletion; edit prompts, regenerate replies, and switch between message branches.
- Streaming replies, deep thinking, smart search, link reading, and source citations; stop generation or continue eligible replies.
- Upload, paste, or drag and drop attachments; use voice input and read replies aloud. A live audio spectrum appears in the first row of the input area while recording on mobile.
- Markdown, syntax highlighting, KaTeX math, and Mermaid diagrams.
- Simplified Chinese and English, light and dark themes, mobile layouts, location settings, and chat history import and export.
- Desktop app with window state, system-browser links, download save dialogs, microphone permission handling, and a hidden menu bar on Windows and Linux.
- Configurable API service and model name for third-party DeepSeek-compatible endpoints.

## Data and storage

Your API key and settings are stored in the browser's localStorage. Conversations and original attachments are stored in IndexedDB. Local data is isolated by browser profile and site origin. Sending messages, uploading attachments, and using speech features sends the relevant content to the configured API service.

The desktop app uses the same IndexedDB and localStorage, located in Electron's userData directory:

- Windows: `%APPDATA%\yixu`
- macOS: `~/Library/Application Support/yixu`
- Linux: `~/.config/yixu`

History import and export in Settings use ZIP archives. After confirmation and successful validation, importing replaces all local conversations and attachments. Exports include conversations and locally available original images, but exclude API keys, settings, and original non-image attachments. See the [history import/export documentation (Chinese)](src/services/chat/history/README.md) for the archive format and preservation details.

Settings → Data → Delete all chats clears all local conversations, original attachments, and unsent drafts after confirmation. It stops ongoing replies and returns to a new chat. Your API key and settings are preserved; files already uploaded to the API service are not deleted.

## Development

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Start the web development server    |
| `pnpm build`         | Build the web version into `dist/`  |
| `pnpm type`          | Run TypeScript type checks          |
| `pnpm lint`          | Lint with oxlint                    |
| `pnpm format`        | Format with oxfmt                   |
| `pnpm dev:desktop`   | Start Electron with the dev server  |
| `pnpm build:desktop` | Build renderer and main process     |
| `pnpm type:electron` | Type-check the Electron main process |
| `pnpm dist:win`      | Package a Windows installer         |
| `pnpm dist:mac`      | Package a macOS DMG                 |
| `pnpm dist:linux`    | Package a Linux AppImage            |
| `pnpm pack:dir`      | Create an unpacked directory only   |

[rspack.config.ts](rspack.config.ts) uses `https://api.deepseek.com` as the build-time default API origin. `createConfig({ apiOrigin, devServer })` customizes the default and the development server proxy. In the desktop app the API service can be switched at runtime in Settings.

Chat uses `deepseek-flash` by default through Anthropic-compatible Messages / Files APIs. Speech features use ASR / TTS endpoints. Requests include extensions for search, link reading, titles, and `latest_reminder`, so the configured service must support the corresponding capabilities. Supported attachment formats are determined by server-side validation.

```text
src/
  app/                 Application layout, themes, and global styles
  components/          Chat, settings, Markdown, and other UI components
  i18n/                English and Chinese translations
  services/
    api/               API requests, SSE, and protocol types
    chat/              Conversations, message branches, storage, and history import/export
    markdown/          Markdown parsing, syntax highlighting, and diagrams
    speech/            Audio recording and read-aloud playback
  utils/               Shared utilities
electron/
  main.ts              Electron main process
```

## Upstream

Based on [deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo). The web version remains compatible with the upstream static build.

## License

[MIT](LICENSE). The build copies the license to `dist/LICENSE`; include it when distributing the app. Third-party dependencies are subject to their own licenses.
