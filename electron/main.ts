import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  nativeTheme,
  session,
  shell,
  type MenuItemConstructorOptions,
} from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const APP_ID = 'com.nickiilord.chat'
const isDev = !app.isPackaged
/** 开发时由 scripts 设置，加载 rspack 开发服务器而不是 dist 里的静态文件。 */
const devServerUrl = process.env.CHAT_DEV_SERVER

const DEFAULT_WINDOW_STATE = { width: 1180, height: 820, maximized: false }

let mainWindow: BrowserWindow | null = null

type WindowState = typeof DEFAULT_WINDOW_STATE

const windowStatePath = () => path.join(app.getPath('userData'), 'window-state.json')

const readWindowState = async (): Promise<WindowState> => {
  try {
    const value = JSON.parse(await readFile(windowStatePath(), 'utf8')) as Partial<WindowState>
    const width = Number(value.width)
    const height = Number(value.height)
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return DEFAULT_WINDOW_STATE
    }
    return {
      width: Math.min(Math.max(Math.round(width), 640), 12000),
      height: Math.min(Math.max(Math.round(height), 560), 12000),
      maximized: value.maximized === true,
    }
  } catch {
    return DEFAULT_WINDOW_STATE
  }
}

const saveWindowState = async (window: BrowserWindow): Promise<void> => {
  try {
    const bounds = window.isMaximized() ? window.getNormalBounds() : window.getBounds()
    await mkdir(app.getPath('userData'), { recursive: true })
    await writeFile(
      windowStatePath(),
      JSON.stringify({
        width: bounds.width,
        height: bounds.height,
        maximized: window.isMaximized(),
      }),
      'utf8'
    )
  } catch {
    // 窗口状态只影响下次打开的尺寸，保存失败不影响使用。
  }
}

const isExternalUrl = (url: string) => /^(https?|mailto):/i.test(url)

/** 外链交给系统浏览器，应用内不允许打开新窗口或跳转到其他页面。 */
const installNavigationHandlers = (window: BrowserWindow): void => {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    if (isExternalUrl(url)) {
      void shell.openExternal(url)
    }
  })
}

/** 只放行麦克风、剪贴板和全屏，其余权限请求一律拒绝。 */
const installPermissionHandlers = (): void => {
  const allowed = new Set(['media', 'clipboard-sanitized-write', 'fullscreen'])
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(allowed.has(permission))
  })
  session.defaultSession.setPermissionCheckHandler((_contents, permission) =>
    allowed.has(permission)
  )
}

/** 导出历史 ZIP 时使用系统保存对话框，默认放到下载目录。 */
const installDownloadHandler = (): void => {
  session.defaultSession.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({
      title: '保存文件 / Save file',
      defaultPath: path.join(app.getPath('downloads'), item.getFilename()),
    })
  })
}

const createMainWindow = async (): Promise<BrowserWindow> => {
  const state = await readWindowState()
  const window = new BrowserWindow({
    width: state.width,
    height: state.height,
    minWidth: 480,
    minHeight: 560,
    show: false,
    // Windows/Linux 默认隐藏菜单栏，按 Alt 才临时显示；macOS 的菜单在系统顶栏，不受影响。
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#17181c' : '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      webviewTag: false,
    },
    ...(isDev ? { icon: path.join(__dirname, '..', 'resources', 'icon.png') } : {}),
  })
  mainWindow = window
  if (state.maximized) {
    window.maximize()
  }
  window.once('ready-to-show', () => window.show())
  window.on('close', () => void saveWindowState(window))
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })
  nativeTheme.on('updated', () => {
    if (!window.isDestroyed()) {
      window.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#17181c' : '#ffffff')
    }
  })
  installNavigationHandlers(window)
  if (devServerUrl) {
    await window.loadURL(devServerUrl)
  } else {
    await window.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }
  return window
}

const menuLabels = () => {
  const zh = app.getLocale().toLowerCase().startsWith('zh')
  return zh
    ? {
        file: '文件',
        edit: '编辑',
        view: '视图',
        window: '窗口',
        undo: '撤销',
        redo: '重做',
        cut: '剪切',
        copy: '复制',
        paste: '粘贴',
        selectAll: '全选',
        close: '关闭',
        quit: '退出',
        reload: '重新加载',
        toggleDevTools: '开发者工具',
        actualSize: '实际大小',
        zoomIn: '放大',
        zoomOut: '缩小',
        fullscreen: '全屏',
        minimize: '最小化',
        about: '关于',
      }
    : {
        file: 'File',
        edit: 'Edit',
        view: 'View',
        window: 'Window',
        undo: 'Undo',
        redo: 'Redo',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        selectAll: 'Select All',
        close: 'Close',
        quit: 'Quit',
        reload: 'Reload',
        toggleDevTools: 'Developer Tools',
        actualSize: 'Actual Size',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        fullscreen: 'Full Screen',
        minimize: 'Minimize',
        about: 'About',
      }
}

const buildMenu = (): void => {
  const label = menuLabels()
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: label.about },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: label.quit },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: label.file,
      submenu: [{ role: 'close', label: label.close }],
    },
    {
      label: label.edit,
      submenu: [
        { role: 'undo', label: label.undo },
        { role: 'redo', label: label.redo },
        { type: 'separator' },
        { role: 'cut', label: label.cut },
        { role: 'copy', label: label.copy },
        { role: 'paste', label: label.paste },
        { role: 'selectAll', label: label.selectAll },
      ],
    },
    {
      label: label.view,
      submenu: [
        { role: 'reload', label: label.reload },
        { type: 'separator' },
        { role: 'resetZoom', label: label.actualSize },
        { role: 'zoomIn', label: label.zoomIn },
        { role: 'zoomOut', label: label.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: label.fullscreen },
        { role: 'toggleDevTools', label: label.toggleDevTools },
      ],
    },
    {
      label: label.window,
      submenu: [
        { role: 'minimize', label: label.minimize },
        ...(process.platform === 'darwin'
          ? [{ role: 'zoom' } as MenuItemConstructorOptions]
          : [{ role: 'close', label: label.close } as MenuItemConstructorOptions]),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.setAppUserModelId(APP_ID)

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })

  app.whenReady()
    .then(async () => {
      installPermissionHandlers()
      installDownloadHandler()
      buildMenu()
      app.setAboutPanelOptions({
        applicationName: 'Chat',
        applicationVersion: app.getVersion(),
        version: `Electron ${process.versions.electron}`,
        copyright: 'MIT License',
      })
      await createMainWindow()
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          void createMainWindow()
        }
      })
    })
    .catch((error: unknown) => {
      dialog.showErrorBox(
        '启动失败 / Failed to start',
        error instanceof Error ? error.message : String(error)
      )
      app.quit()
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
