# 🚀 快速开始指南

## 自动发现功能

OpenClaw Manager 现在支持自动发现所有 Gateway 实例，无需手动配置！

### 工作原理

1. **自动扫描** - 启动时自动扫描 `~/.openclaw-*` 目录
2. **读取配置** - 自动读取每个实例的 `openclaw.json` 配置文件
3. **提取信息** - 自动获取端口、模型、Agent、飞书机器人名称等信息
4. **智能缓存** - 缓存发现结果 1 分钟，减少文件系统访问

### 发现的信息

对于每个 Gateway 实例，自动提取：
- ✅ Profile ID（如 `main-assistant`）
- ✅ 飞书机器人名称（如 `主助理`）
- ✅ 端口号（如 `18789`）
 使用的模型（如 `Claude Opus 4.6`）
- ✅ Agent ID（如 `main-agent`）
- ✅ 配置文件路径

### 使用步骤

#### 1. 克隆项目

```bash
git clone https://github.com/xianyu110/openclaw-manager.git
cd openclaw-manager
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 启动应用

```bash
nptart
```

启动时会自动扫描并显示：

```
🚀 OpenClaw Manager API 运行在 http://localhost:3001
📡 正在自动发现 Gateway 实例...
✅ 发现 4 个 Gateway 实例:
   - 主助理 (main-assistant) - 端口 18789 - Claude Opus 4.6
   - 内容创作助手 (content-creator) - 端口 18790 - Claude Sonnet 4.5
   - 技术开发助手 (tech-dev) - 端口 18791 - Claude Sonnet 4.5 Thinking
   - AI资讯助手 (ai-news) - 端口 18792 - Gemini 2.5 Flash
```

#### 4. 打开浏览器

访问 http://localhost:3000

### 界面功能

#### 🔍 重新扫描按钮
- 点击"🔍 重新扫描"按钮
- 清除缓存并重新发现所有 Gateway 实例
保证准确性  
✅ **智能缓存** - 减少文件系统访问，提高性能  
✅ **容错处理** - 配置读取失败时使用默认配置  

### 下一步

- 🎮 使用界面控制所有 Gateway
- ⚙️ 配置 launchd 保活服务
- 📝 查看服务日志
- 🔄 一键启动/停止/重启

---

**享受自动化的便利！** 🎉
json
```

### API 端点

#### GET /api/status
获取所有服务状态（自动发现）

#### POST /api/refresh-discovery
刷新服务发现缓存

**响应示例:**
```json
{
  "success": true,
  "message": "发现 4 个 Gateway 实例",
  "services": [
    {
      "id": "main-assistant",
      "name": "主助理",
      "port": 18789,
      "model": "Claude Opus 4.6",
      "agent": "main-agent",
      "configPath": "/Users/xxx/.openclaw-main-assistant/openclaw.json"
    }
  ]
}
```

### 优势

✅ **零配置** - 无需手动编辑服务列表  
✅ **自动同步** - 添加/删除 Gateway 后自动识别  
✅ **准确信息** - 直接从配置文件读取，l-gateways.sh

# 配置保活服务
./setup-launchd.sh
```

### 故障排查

#### 未发现任何实例

```bash
# 检查是否有 .openclaw-* 目录
ls -d ~/.openclaw-*

# 检查配置文件是否存在
ls ~/.openclaw-*/openclaw.json
```

#### 配置文件读取失败

```bash
# 检查配置文件格式
cat ~/.openclaw-main-assistant/openclaw.json | jq .

# 确保 JSON 格式正确
```

#### 端口信息不正确

```bash
# 检查配置文件中的端口
jq '.gateway.port' ~/.openclaw-main-assistant/openclaw.json

# 手动修改端口
jq '.gateway.port = 18789' ~/.openclaw-main-assistant/openclaw.json > tmp.json
mv tmp.json ~/.openclaw-main-assistant/openclaw.置

如果没有发现任何 Gateway 实例，会使用默认配置：

```javascript
[
  { id: 'main-assistant', name: '主助理', port: 18789, model: 'Claude Opus 4.6' },
  { id: 'content-creator', name: '内容创作助手', port: 18790, model: 'Claude Sonnet 4.5' },
  { id: 'tech-dev', name: '技术开发助手', port: 18791, model: 'Claude Sonnet 4.5 Thinking' },
  { id: 'ai-news', name: 'AI资讯助手', port: 18792, model: 'Gemini 2.5 Flash' },
]
```

### 配置 Gateway

如果还没有配置 Gateway，可以使用以下脚本：

```bash
# 创建多 Gateway 配置
./setup-multi-gateway-simple.sh

# 启动所有 Gateway
./start-al
- 更新所有服务的运行状态
- 自动每 10 秒刷新一次

### 默认配- 适用于添加或删除 Gateway 后

#### 刷新状态按钮
- 点击"刷新状态"按钮