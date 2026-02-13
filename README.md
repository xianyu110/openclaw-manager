# 🦞 OpenClaw Manager

<div align="center">

![OpenClaw Manager](https://img.shields.io/badge/OpenClaw-Manager-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**现代化的 OpenClaw 多 Gateway 管理界面**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用说明](#-使用说明) • [API 文档](#-api-文档)

</div>

---

## 📖 简介

OpenClaw Manager 是一个基于 React + Tailwind CSS 的现代化 Web 管理界面，用于管理多个 OpenClaw Gateway 实例。它提供了直观的可视化界面，让你可以轻松监控和控制所有 Gateway 服务。

### 为什么需要这个工具？

当你使用 OpenClaw 的多 Gateway 架构（每个飞书机器人对应一个独立的 Gateway 实例）时，需要一个统一的管理界面来：
- 📊 实时监控所有 Gateway 的运行状态
- 🎮 一键启动/停止/重启服务
- ⚙️ 配置 launchd 保活服务
- 📝 查看服务日志
- 💻 美观的现代化界面

## ✨ 功能特性

### 核心功能

- ✅ **实时状态监控** - 自动检测所有 Gateway 的运行状态（每 10 秒刷新）
- ✅ **服务控制** - 一键启动/停止/重启所有或单个服务
- ✅ **保活配置** - 一键配置 launchd 保活，支持开机自启和崩溃重启
- ✅ **日志查看** - 实时查看每个服务的运行日志
- ✅ **美观界面** - 现代化设计，响应式布局，支持移动端

### 技术亮点

- ⚡️ **快速开发** - Vite 提供极速的开发体验
- 🎨 **现代设计** - Tailwind CSS 打造精美界面
- 🔄 **前后端分离** - React 前端 + Express 后端
- 📱 **响应式布局** - 完美支持桌面和移动设备
- 🚀 **高性能** - 异步 API 调用，并行状态检测

## 🖼️ 界面预览

### 主界面
- 顶部操作栏：配置保活、启动/停止/重启所有服务
- 服务卡片：显示每个 Gateway 的状态、端口、模型信息
- 系统信息：内存占用、运行服务数、自动刷新状态

### 服务卡片
每个服务卡片包含：
- 🟢 运行状态指示灯
- 📝 服务名称和 ID
- 🔌 端口号
- 🤖 使用的 AI 模型
- 🎛️ 快捷操作按钮

## 🚀 快速开始

### 前置要求

- Node.js >= 16
- npm 或 yarn
- OpenClaw 已安装并配置好多 Gateway

### 安装

```bash
# 克隆项目
git clone https://github.com/xianyu110/openclaw-manager.git
cd openclaw-manager

# 安装依赖
npm install
```

### 配置

1. **确保 OpenClaw Gateway 已配置**

项目默认管理 4 个 Gateway 实例：
- main-assistant (端口 18789)
- content-creator (端口 18790)
- tech-dev (端口 18791)
- ai-news (端口 18792)

如需修改，请编辑 `server.js` 中的 `services` 数组。

2. **配置管理脚本路径**

编辑 `server.js`，更新脚本路径为你的 OpenClaw 配置目录：

```javascript
// 示例：如果脚本在 ~/openclaw-scripts/
const scriptPath = path.join(process.env.HOME, 'openclaw-scripts', 'setup-launchd.sh')
```

### 启动

```bash
# 启动开发服务器（前端 + 后端）
npm start
```

应用将在以下地址启动：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## 📚 使用说明

### 首次使用

1. **启动应用**
   ```bash
   npm start
   ```

2. **打开浏览器**
   访问 http://localhost:3000

3. **配置保活服务**
   - 点击"⚙️ 配置保活"按钮
   - 等待配置完成
   - 服务将自动开机启动并在崩溃后重启

### 日常操作

#### 查看服务状态
- 界面会自动每 10 秒刷新状态
- 点击"刷新状态"按钮手动刷新
- 绿色指示灯表示运行中，红色表示已停止

#### 控制服务
- **启动所有**: 一键启动所有 4 个 Gateway
- **停止所有**: 一键停止所有 Gateway
- **重启所有**: 一键重启所有 Gateway
- **单个控制**: 在服务卡片中点击"重启"按钮

#### 查看日志
- 点击服务卡片中的"查看日志"按钮
- 显示最近 100 行日志
- 支持实时刷新

## 🔧 开发

### 项目结构

```
openclaw-manager/
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # React 入口
│   └── index.css        # 全局样式
├── server.js            # Express 后端 API
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
├── postcss.config.js    # PostCSS 配置
├── package.json         # 项目配置
└── README.md            # 项目文档
```

### 开发模式

```bash
# 只启动前端（需要手动启动后端）
npm run dev

# 只启动后端
npm run server

# 同时启动前后端（推荐）
npm start
```

### 构建生产版本

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

## 📡 API 文档

### 状态查询

#### GET /api/status
获取所有服务的状态信息

**响应示例:**
```json
{
  "services": [
    {
      "id": "main-assistant",
      "name": "主助理",
      "port": 18789,
      "status": "running",
      "model": "Claude Opus 4.6",
      "launchd": true
    }
  ]
}
```

### 批量操作

- `POST /api/start-all` - 启动所有 Gateway 服务
- `POST /api/stop-all` - 停止所有 Gateway 服务
- `POST /api/restart-all` - 重启所有 Gateway 服务
- `POST /api/setup-launchd` - 配置 launchd 保活服务

### 单个服务操作

- `POST /api/start/:serviceId` - 启动指定的 Gateway 服务
- `POST /api/stop/:serviceId` - 停止指定的 Gateway 服务
- `POST /api/restart/:serviceId` - 重启指定的 Gateway 服务
- `GET /api/logs/:serviceId` - 获取指定服务的日志（最近 100 行）

## 🛠️ 故障排查

### 后端无法连接

```bash
# 检查端口占用
lsof -i :3001

# 手动启动后端
npm run server
```

### 前端无法访问

```bash
# 检查端口占用
lsof -i :3000

# 清除缓存重新启动
rm -rf node_modules/.vite
npm start
```

### 服务控制失败

确保管理脚本存在并有执行权限：

```bash
# 检查脚本
ls -la ~/your-openclaw-scripts/*.sh

# 添加执行权限
chmod +x ~/your-openclaw-scripts/*.sh

# 更新 server.js 中的脚本路径
```

## 🎯 配置自定义

### 修改服务列表

编辑 `server.js` 中的 `services` 数组：

```javascript
const services = [
  { 
    id: 'your-service', 
    name: '你的服务', 
    port: 18789, 
    model: 'Your Model' 
  },
  // 添加更多服务...
]
```

### 修改刷新间隔

编辑 `src/App.jsx` 中的刷新间隔（毫秒）：

```javascript
const interval = setInterval(checkStatus, 10000) // 改为你想要的间隔
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2026-02-13)

- ✨ 初始版本发布
- ✅ 实时状态监控
- ✅ 服务控制功能
- ✅ 保活配置
- ✅ 日志查看
- ✅ 响应式界面

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - 强大的 AI Agent 框架
- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vite](https://vitejs.dev/) - 前端构建工具
- [Express](https://expressjs.com/) - Node.js Web 框架

## 📮 联系方式

- 作者: Maynor
- GitHub: [@xianyu110](https://github.com/xianyu110)
- 项目地址: [openclaw-manager](https://github.com/xianyu110/openclaw-manager)

---

<div align="center">

**[⬆ 回到顶部](#-openclaw-manager)**

Made with ❤️ by Maynor

</div>
