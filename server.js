import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(express.json())

// 服务配置
const services = [
  { id: 'main-assistant', name: '主助理', port: 18789, model: 'Claude Opus 4.6' },
  { id: 'content-creator', name: '内容创作助手', port: 18790, model: 'Claude Sonnet 4.5' },
  { id: 'tech-dev', name: '技术开发助手', port: 18791, model: 'Claude Sonnet 4.5 Thinking' },
  { id: 'ai-news', name: 'AI资讯助手', port: 18792, model: 'Gemini 2.5 Flash' },
]

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

app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Manager API 运行在 http://localhost:${PORT}`)
})
