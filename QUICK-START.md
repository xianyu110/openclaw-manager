# 🚀 OpenClaw Manager 快速开始

## 一键安装和启动

```bash
# 克隆项目
git clone https://github.com/xianyu110/openclaw-manager.git
cd openclaw-manager

# 安装依赖
npm install

# 启动应用
npm start
```

然后打开浏览器访问: http://localhost:3000

## 配置说明

### 1. 修改服务列表

如果你的 Gateway 配置不同，编辑 `server.js`:

```javascript
const services = [
  { id: 'main-assistant', name: '主助理', port: 18789, model: 'Claude Opus 4.6' },
  { id: 'content-creator', name: '内容创作助手', port: 18790, model: 'Claude Sonnet 4.5' },
  // 添加或修改你的服务...
]
```

### 2. 配置脚本路径

如果管理脚本不在父目录，修改 `server.js` 中的路径：

```javascript
// 启动所有服务
app.post('/api/start-all', async (req, res) => {
  const scriptPath = '/your/custom/path/start-all-gateways.sh'
  await execAsync(`bash "${scriptPath}"`)
})
```

## 常见问题

### Q: 后端无法连接？
A: 检查端口 3001 是否被占用: `lsof -i :3001`

### Q: 前端无法访问？
A: 检查端口 3000 是否被占用: `lsof -i :3000`

### Q: 服务控制失败？
A: 确保管理脚本存在并有执行权限: `chmod +x *.sh`

## 功能演示

1. **查看状态** - 自动显示所有 Gateway 运行状态
2. **配置保活** - 点击"⚙️ 配置保活"按钮
3. **启动服务** - 点击"▶️ 启动所有"按钮
4. **查看日志** - 点击服务卡片中的"查看日志"

## 更多信息

查看完整文档: [README.md](README.md)
