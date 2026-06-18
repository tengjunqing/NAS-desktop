# MyNAS Client

MyNAS 桌面客户端 - macOS 原生体验的个人云存储管理工具。

## 功能特性

- **原生 macOS 体验** - 隐藏标题栏、系统托盘、流畅动画
- **文件管理** - 浏览、上传、下载、删除、拖放上传
- **照片浏览** - 时间线视图、网格展示、全屏查看
- **视频播放** - 内置播放器、支持多种格式
- **文件分享** - 创建分享链接、管理分享
- **用户管理** - 管理员面板、创建/删除用户
- **多存储卷** - 支持切换不同存储位置

## 开发

```bash
# 安装依赖
npm install

# 开发模式（需要同时启动 Vite 开发服务器）
npm run dev

# 或分别启动
npm run dev:renderer  # Vite 开发服务器 (端口 5174)
npm run dev:main      # Electron 主进程
```

## 构建

```bash
# 构建生产版本
npm run build

# 打包为 macOS 应用
npm run package

# 仅打包 ARM64 (Apple Silicon)
npm run package:arm64

# 仅打包 x64 (Intel)
npm run package:x64
```

打包后的应用将在 `release/` 目录中生成。

## 连接服务器

首次启动时，输入 MyNAS 服务器地址：
- 本机：`http://localhost:8080`
- 局域网：`http://<Mac Mini IP>:8080`

默认登录账号：`admin` / `admin`

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具

## 项目结构

```
mynas-client/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # React 渲染进程
│       ├── pages/      # 页面组件
│       ├── components/ # 通用组件
│       └── styles/     # 样式文件
├── assets/             # 应用资源
├── dist/               # 构建输出
└── release/            # 打包输出
```

## License

MIT