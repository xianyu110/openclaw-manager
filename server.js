import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(express.json())

// 自动发现 OpenClaw Gateway 实例
async function discoverGateways() {
  const gateways = []
  const homeDir = process.env.HOME
  
  try {
    // 查找所有 .openclaw-* 目录
    const { stdout } = await execAsync(`ls -d ${homeDir}/.openclaw-* 2>/dev/null || true`)
    const dirs = stdout.trim().split('\n').filter(d => d)
    
    for (const dir of dirs) {
      try {
        // 提取 profile 名称
        const profileName = path.basename(dir).replace('.openclaw-', '')
        
        // 读取配置文件
        const configPath = path.join(dir, 'openclaw.json')
        const configContent = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(configContent)
        
        // 提取信息
        const port = config.gateway?.port || 18789
        const agentId = config.agents?.list?.[0]?.id || 'unknown'
        const modelId = config.agents?.list?.[0]?.model || 'unknown'
        
        // 提取飞书账号名称
        const accounts = config.channels?.feishu?.accounts || {}
        const accountName = Object.values(accounts)[0]?.botName || profileName
        
        gateways.push({
          id: profileName,
          name: accountName,
          port: port,
          model: modelId,
          agent: agentId,
          configPath: configPath
        })
      } catch (error) {
        console.warn(`⚠️  无法读取配置: ${dir}`, error.message)
      }
    }
    
    // 如果没有发现任何 Gateway，返回默认配置
    if (gateways.length === 0) {
      console.log('ℹ️  未发现 Gateway 配置，使用默认配置')
      return [
        { id: 'main-assistant', name: '主助理', port: 18789, model: 'Claude Opus 4.6', agent: 'main-agent' },
        { id: 'content-creator', name: '内容创作助手', port: 18790, model: 'Claude Sonnet 4.5', agent: 'content-agent' },
        { id: 'tech-dev', name: '技术开发助手', port: 18791, model: 'Claude Sonnet 4.5 Thinking', agent: 'tech-agent' },
        { id: 'ai-news', name: 'AI资讯助手', port: 18792, model: 'Gemini 2.5 Flash', agent: 'ainews-agent' },
      ]
    }
    
    console.log(`✅ 发现 ${gateways.length} 个 Gateway 实例:`)
    gateways.forEach(g => {
      console.log(`   - ${g.name} (${g.id}) - 端口 ${g.port} - ${g.model}`)
    })
    
    return gateways
  } catch (error) {
    console.error('❌ 自动发现失败:', error.message)
    return []
  }
}

// 缓存服务列表
let cachedServices = []
let lastDiscoveryTime = 0
const DISCOVERY_CACHE_TTL = 60000 // 1 分钟缓存

// 获取服务列表（带缓存）
async function getServices() {
  const now = Date.now()
  if (cachedServices.length > 0 && now - lastDiscoveryTime < DISCOVERY_CACHE_TTL) {
    return cachedServices
  }
  
  cachedServices = await discoverGateways()
  lastDiscoveryTime = now
  return cachedServices
}

// 检查端口是否在监听
async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port}`)
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

// 检查 launchd 服务状态
async function checkLaunchdService(serviceId) {
  try {
    const { stdout } = await execAsync(`launchctl list | grep com.openclaw.${serviceId}`)
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

// 获取所有服务状态
app.get('/api/status', async (req, res) => {
  try {
    const services = await getServices()
    
    const statusPromises = services.map(async (service) => {
      const portListening = await checkPort(service.port)
      const launchdRunning = await checkLaunchdService(service.id)
      
      return {
        ...service,
        status: portListening ? 'running' : 'stopped',
        launchd: launchdRunning,
      }
    })
    
    const servicesWithStatus = await Promise.all(statusPromises)
    
    res.json({ services: servicesWithStatus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 刷新服务发现缓存
app.post('/api/refresh-discovery', async (req, res) => {
  try {
    cachedServices = []
    lastDiscoveryTime = 0
    const services = await getServices()
    res.json({ 
      success: true, 
      message: `发现 ${services.length} 个 Gateway 实例`,
      services: services
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 启动所有服务
app.post('/api/start-all', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'start-all-gateways.sh')
    await execAsync(`bash "${scriptPath}"`)
    res.json({ success: true, message: '所有服务已启动' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 停止所有服务
app.post('/api/stop-all', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'stop-all-gateways.sh')
    await execAsync(`bash "${scriptPath}"`)
    res.json({ success: true, message: '所有服务已停止' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 重启所有服务
app.post('/api/restart-all', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'restart-launchd.sh')
    await execAsync(`bash "${scriptPath}"`)
    res.json({ success: true, message: '所有服务已重启' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 配置保活
app.post('/api/setup-launchd', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'setup-launchd.sh')
    await execAsync(`bash "${scriptPath}"`)
    res.json({ success: true, message: '保活服务配置成功' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 启动单个服务
app.post('/api/start/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const plistFile = `${process.env.HOME}/Library/LaunchAgents/com.openclaw.${serviceId}.plist`
    await execAsync(`launchctl load "${plistFile}"`)
    res.json({ success: true, message: `${serviceId} 已启动` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 停止单个服务
app.post('/api/stop/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const plistFile = `${process.env.HOME}/Library/LaunchAgents/com.openclaw.${serviceId}.plist`
    await execAsync(`launchctl unload "${plistFile}"`)
    res.json({ success: true, message: `${serviceId} 已停止` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 重启单个服务
app.post('/api/restart/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const plistFile = `${process.env.HOME}/Library/LaunchAgents/com.openclaw.${serviceId}.plist`
    await execAsync(`launchctl unload "${plistFile}"`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    await execAsync(`launchctl load "${plistFile}"`)
    res.json({ success: true, message: `${serviceId} 已重启` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取日志
app.get('/api/logs/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const logFile = `${process.env.HOME}/.openclaw-${serviceId}/stdout.log`
    const { stdout } = await execAsync(`tail -100 "${logFile}"`)
    res.json({ logs: stdout })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, async () => {
  console.log(`🚀 OpenClaw Manager API 运行在 http://localhost:${PORT}`)
  console.log(`📡 正在自动发现 Gateway 实例...`)
  await getServices()
})
