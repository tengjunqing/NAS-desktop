# MyNAS Client 开发验收清单

---

## 阶段一：基础修复（P0）✅

### 1.1 修复 preload 构建链路

- [x] 添加 `tsconfig.preload.json`（编译 preload.ts）
- [x] `package.json` 新增 `build:preload` 脚本
- [x] `npm run build` 包含 preload 编译步骤
- [x] 构建后 `dist/preload/preload.js` 文件存在
- [ ] 生产构建启动后无 preload 加载错误（待联调验证）
- [ ] `npm run package` 打包成功，安装后正常运行（待联调验证）

### 1.2 补全分享创建流程

- [x] Files 页面右键菜单增加「创建分享链接」选项
- [x] 点击后弹出分享配置表单（密码、有效期、最大下载次数）
- [x] 调用 `createShare()` API 创建分享
- [x] 创建成功后显示分享 URL 并可一键复制
- [x] Shares 页面增加「新建分享」按钮
- [x] Shares 页面创建表单包含存储卷选择 + 文件路径输入
- [x] 路径为空时阻止创建并显示错误提示

### 1.3 添加文件重命名/移动 UI

- [x] 右键菜单增加「重命名」选项
- [x] 点击后弹出重命名输入框，调用 `moveFile()` API
- [x] 右键菜单增加「移动到…」选项
- [x] 点击后弹出目标路径选择器，调用 `moveFile()` API
- [x] 操作成功后列表自动刷新
- [x] 操作失败时有错误提示

### 1.4 移除未使用依赖

- [x] `react-router-dom` 已从 package.json 中移除
- [x] `electron-store` 已从 package.json 中移除
- [x] `npm ls` 无悬空依赖警告
- [x] 应用正常构建和运行 (`npm run build` 通过)

---

## 阶段二：体验增强（P1）✅

### 2.1 文件上传进度条

- [x] 单文件上传时显示百分比进度条
- [x] 文件夹上传时显示当前批次文件名 + 进度
- [x] 上传完成后进度条自动消失
- [x] 上传失败时显示错误信息
- [ ] 支持取消上传（未实现，可选）

### 2.2 存储统计面板

- [x] Files 页面顶部显示存储空间概览
- [x] 显示已用空间、总空间、百分比进度条
- [x] 进度条可视化 (CSS 进度条)
- [x] 切换存储卷时数据更新
- [x] 空间满（>90%）时红色警告提示

### 2.3 文件搜索/过滤

- [x] Files 页面添加搜索输入框（带搜索图标和清除按钮）
- [x] 输入关键词后实时过滤文件名 (useMemo)
- [x] 支持按文件类型筛选（全部/图片/视频/文档/其他）
- [x] 搜索/筛选保留路径上下文（在 breadcrumb 中）
- [x] 清空搜索后恢复完整列表
- [x] 无结果时显示「没有匹配的文件」空状态

### 2.4 文件列表缩略图

- [x] 图片文件行显示缩略图（28x28, object-fit cover）
- [x] 视频文件行显示缩略图
- [x] 缩略图加载失败时回退显示 emoji 图标 (onError)
- [x] 缩略图尺寸 28x28, 不影响列表布局
- [x] 缩略图使用 `?view=1` 端点

---

## 阶段三：架构升级（P2）

### 3.1 引入全局状态管理

- [ ] 创建 `AuthContext` 管理 token/user 状态
- [ ] 创建 `AppContext` 管理 currentPage/selectedVolume/selectedPath
- [ ] 各页面组件通过 `useContext` 获取全局状态
- [ ] 消除跨层级 prop drilling
- [ ] token 变更时所有受影响的组件正确更新

### 3.2 CSS 模块化拆分

- [ ] `global.css` 拆分为独立文件
- [ ] `styles/variables.css` — CSS 自定义属性（颜色、间距、阴影）
- [ ] `styles/layout.css` — Sidebar、布局、标题栏拖拽区
- [ ] `pages/Files.module.css` — 文件页面样式
- [ ] `pages/Photos.module.css` — 照片页面样式
- [ ] `pages/Videos.module.css` — 视频页面样式
- [ ] `pages/Shares.module.css` — 分享页面样式
- [ ] `pages/Admin.module.css` — 管理页面样式
- [ ] `components/Sidebar.module.css` — 侧边栏样式
- [ ] `components/*.module.css` — 通用组件样式
- [ ] 导入路径正确，无未引用样式

### 3.3 Error Boundary + 网络容错

- [ ] `ErrorBoundary` 组件渲染异常时显示友好回退 UI
- [ ] 「重试」按钮可重新渲染子组件
- [ ] API 层添加请求超时机制（默认 30s）
- [ ] API 层添加自动重试（失败时最多重试 2 次，指数退避）
- [ ] 网络断开时显示离线提示条
- [ ] 401 错误自动跳转登录页（现有逻辑保持）
- [ ] 其他错误显示 toast 或内联错误提示

### 3.4 路由实现

- [ ] 使用 hash 路由（`#/files`、`#/photos`、`#/videos`、`#/shares`、`#/admin`）
- [ ] 支持浏览器前进/后退按钮
- [ ] 页面切换时滚动位置重置
- [ ] 未登录时所有路由重定向到登录页
- [ ] 非管理员用户无法访问 `#/admin`
- [ ] 未知路由显示 404 页面（可选）

---

## 阶段四：原生能力与进阶功能（P3）

### 4.1 接入 Electron 原生能力

- [ ] 文件下载使用原生「另存为」对话框（`dialog:saveFile`）
- [ ] 文件上传按钮切换为原生文件选择器（`dialog:openFiles`）
- [ ] 文件夹上传切换为原生目录选择器（`dialog:openDirectory`）
- [ ] 「在 Finder 中显示」功能（可选，需主进程支持）
- [ ] 外部链接使用系统默认浏览器打开（`shell:openExternal`）

### 4.2 文件多选与批量操作

- [ ] 文件列表每行前增加复选框
- [ ] 列表头增加全选/取消全选复选框
- [ ] 选中文件时顶部出现批量操作工具栏
- [ ] 批量删除（确认弹窗 + 逐个调用 API）
- [ ] 批量下载（打包或逐个下载）
- [ ] 选择操作不影响右键菜单功能
- [ ] 切换目录时清除选择状态

### 4.3 最近照片视图

- [ ] Photos 页面增加「最近」和「时间线」两个 Tab/视图切换
- [ ] 「最近」Tab 调用 `getRecentPhotos()` API
- [ ] 展示最近 N 张照片的网格视图
- [ ] 支持点击放大查看
- [ ] 默认显示「最近」视图或「时间线」视图（保持向后兼容）

### 4.4 主题切换支持

- [ ] 暗色主题（现有样式作为默认）
- [ ] 亮色主题 CSS 变量配置
- [ ] 页面顶部/侧边栏添加主题切换按钮
- [ ] 主题偏好持久化到 localStorage
- [ ] 主题切换时所有组件即时更新，无闪烁
- [ ] 亮色主题下所有页面视觉一致

---

## 最终验收（全阶段）

- [ ] `npm run dev` 开发模式正常启动
- [ ] `npm run build` 构建成功无报错
- [ ] `npm run package` 打包成功，生成 .dmg
- [ ] 安装 .dmg 后应用正常运行
- [ ] 无控制台错误/警告
- [ ] TypeScript 编译无类型错误
- [ ] 与 MyNAS 服务器全部 API 正常通信
- [ ] README.md 更新至最新状态（如需）
