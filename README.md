# MusicBox - 桌面音乐播放器

一个基于 Tauri + React + TypeScript 开发的桌面音乐播放器，支持本地音乐和 B站在线音频。

## 功能特性

### 音乐管理
- 扫描本地文件夹导入音乐
- 支持多种音频格式（MP3, M4A, FLAC, WAV, OGG 等）
- 创建和管理自定义歌单
- 收藏歌曲到"我喜欢的音乐"

### 在线音乐
- 解析 B站视频/音频链接
- 支持分P视频（通过 `?p=` 参数）
- 下载 B站音频到本地

### 播放功能
- 播放队列管理
- 上一首/下一首
- 音量控制
- 播放进度显示与拖拽
- 播放列表（队列）管理
- 右键菜单：添加到歌单、添加到下一首

### 界面设计
- 自定义窗口标题栏（液态玻璃效果）
- 简约现代的深色/浅色主题
- DaisyUI 组件库

## 技术栈

- **前端**：React 19 + TypeScript + Vite 7
- **UI**：TailwindCSS 4 + DaisyUI 5
- **状态管理**：Zustand
- **路由**：TanStack Router
- **后端**：Tauri 2.0 + Rust
- **AI 功能**：OpenAI API 集成

## 开发

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm tauri dev
# 或
pnpm td
```

### 打包
```bash
# 构建 NSIS 安装包
pnpm tauri build --bundles nsis

# 构建 MSI 安装包
pnpm tauri build --bundles msi
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── PlayerBar.tsx    # 播放栏
│   ├── SideBar.tsx      # 侧边栏
│   └── TitleBar.tsx     # 自定义标题栏
├── routes/              # 路由页面
│   ├── collections/     # 音乐库页面
│   ├── settings.tsx     # 设置页面
│   └── __root.tsx       # 根布局
└── stores/              # 状态管理
    └── usePlayerStore.ts

src-tauri/
└── src/
    ├── commands/        # Tauri 命令
    │   ├── file_scan.rs # 文件扫描
    │   └── online.rs    # 在线音频处理
    ├── db.rs            # 数据持久化
    └── models.rs        # 数据模型
```

## 数据存储

应用数据存储在：
- Windows: `%APPDATA%\com.cookie.test1\`
- macOS: `~/Library/Application Support/com.cookie.test1/`
- Linux: `~/.config/com.cookie.test1/`

存储文件：
- `local_library.json` - 本地曲库
- `play_queue.json` - 播放队列
- `playlists.json` - 歌单数据
- `settings.json` - 应用设置

## 注意事项

- B站音频链接会存储 BV 号而非直接存储音频 URL，每次播放时动态解析
- 下载功能需要先在设置中配置下载文件夹
- 使用自定义窗口时，拖拽标题栏可以移动窗口