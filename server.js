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
        const modelConfig = config.agents?.list?.[0]?.model
        
        // 处理模型配置（可能是字符串或对象）
        let modelId = 'unknown'
        if (typeof modelConfig === 'string') {
          modelId = modelConfig
        } else if (modelConfig && typeof modelConfig === 'object') {
          modelId = modelConfig.primary || modelConfig.id || 'unknown'
        }
        
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

// ==================== Gateway CRUD 操作 ====================

// 获取单个 Gateway 配置
app.get('/api/gateway/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const configPath = `${process.env.HOME}/.openclaw-${serviceId}/openclaw.json`
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    res.json({ 
      success: true, 
      config: config,
      serviceId: serviceId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取 Gateway 的 SOUL.md 内容
app.get('/api/gateway/:serviceId/soul', async (req, res) => {
  try {
    const { serviceId } = req.params
    const configPath = `${process.env.HOME}/.openclaw-${serviceId}/openclaw.json`
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    const agentId = config.agents?.list?.[0]?.id || 'default'
    const soulPath = `${process.env.HOME}/.openclaw-${serviceId}/agent-configs/${agentId}/SOUL.md`
    
    try {
      const soulContent = await fs.readFile(soulPath, 'utf-8')
      res.json({ 
        success: true, 
        content: soulContent,
        path: soulPath
      })
    } catch {
      // 如果文件不存在，返回默认内容
      res.json({ 
        success: true, 
        content: '# Agent 人格设定\n\n## 角色定位\n你是一个专业的 AI 助手。\n\n## 性格特点\n- 友好、专业\n- 乐于助人\n- 思维清晰\n\n## 工作方式\n- 认真倾听用户需求\n- 提供准确的信息\n- 保持礼貌和耐心\n',
        path: soulPath
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建新的 Gateway
app.post('/api/gateway', async (req, res) => {
  try {
    const { 
      profileId, 
      botName, 
      port, 
      agentId, 
      modelId,
      customModel,
      useCustomModel,
      customProvider,
      customBaseUrl,
      customApiKey,
      appId, 
      appSecret,
      soulContent
    } = req.body
    
    // 验证必填字段
    if (!profileId || !botName || !port || !agentId || !appId || !appSecret) {
      return res.status(400).json({ error: '缺少必填字段' })
    }
    
    // 确定使用的模型
    let finalModel
    if (useCustomModel) {
      if (!customProvider || !customModel || !customBaseUrl || !customApiKey) {
        return res.status(400).json({ error: '自定义模型需要填写 Provider、模型 ID、Base URL 和 API Key' })
      }
      finalModel = `${customProvider}/${customModel}`
    } else {
      finalModel = modelId
    }
    
    if (!finalModel) {
      return res.status(400).json({ error: '请选择或输入模型' })
    }
    
    // 检查 profile 是否已存在
    const profileDir = `${process.env.HOME}/.openclaw-${profileId}`
    try {
      await fs.access(profileDir)
      return res.status(400).json({ error: `Profile ${profileId} 已存在` })
    } catch {
      // 目录不存在，继续创建
    }
    
    // 检查端口是否已被占用
    const services = await getServices()
    if (services.some(s => s.port === port)) {
      return res.status(400).json({ error: `端口 ${port} 已被占用` })
    }
    
    // 创建 profile 目录
    await fs.mkdir(profileDir, { recursive: true })
    
    // 读取默认配置模板（从 ~/.openclaw/ 或创建基础配置）
    let baseConfig = {}
    try {
      const defaultConfigPath = `${process.env.HOME}/.openclaw/openclaw.json`
      const defaultContent = await fs.readFile(defaultConfigPath, 'utf-8')
      baseConfig = JSON.parse(defaultContent)
    } catch {
      // 如果没有默认配置，使用基础模板
      baseConfig = {
        gateway: { port: 18789 },
        channels: { feishu: { accounts: {}, groups: {} } },
        agents: { list: [] },
        models: { mode: 'merge', providers: {} }
      }
    }
    
    // 如果使用自定义模型，添加 provider 配置
    if (useCustomModel) {
      if (!baseConfig.models) {
        baseConfig.models = { mode: 'merge', providers: {} }
      }
      if (!baseConfig.models.providers) {
        baseConfig.models.providers = {}
      }
      
      // 添加自定义 provider
      baseConfig.models.providers[customProvider] = {
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        auth: 'api-key',
        api: 'openai-completions',
        models: [
          {
            id: customModel,
            name: customModel,
            reasoning: false,
            input: ['text'],
            cost: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0
            },
            contextWindow: 128000,
            maxTokens: 8192
          }
        ]
      }
    }
    
    // 修改配置
    const newConfig = {
      ...baseConfig,
      gateway: {
        ...baseConfig.gateway,
        port: port
      },
      channels: {
        ...baseConfig.channels,
        feishu: {
          ...baseConfig.channels?.feishu,
          accounts: {
            [profileId]: {
              appId: appId,
              appSecret: appSecret,
              botName: botName,
              enabled: true
            }
          },
          groups: {}
        }
      },
      agents: {
        ...baseConfig.agents,
        list: [{
          id: agentId,
          model: finalModel
        }]
      }
    }
    
    // 写入配置文件
    const configPath = path.join(profileDir, 'openclaw.json')
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2))
    
    // 创建 agent 配置目录和 SOUL.md
    const agentConfigDir = path.join(profileDir, 'agent-configs', agentId)
    await fs.mkdir(agentConfigDir, { recursive: true })
    
    const soulPath = path.join(agentConfigDir, 'SOUL.md')
    const finalSoulContent = soulContent || '# Agent 人格设定\n\n## 角色定位\n你是一个专业的 AI 助手。\n\n## 性格特点\n- 友好、专业\n- 乐于助人\n- 思维清晰\n\n## 工作方式\n- 认真倾听用户需求\n- 提供准确的信息\n- 保持礼貌和耐心\n'
    await fs.writeFile(soulPath, finalSoulContent)
    
    // 清除缓存
    cachedServices = []
    lastDiscoveryTime = 0
    
    res.json({ 
      success: true, 
      message: `Gateway ${profileId} 创建成功`,
      profileId: profileId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新 Gateway 配置
app.put('/api/gateway/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const { 
      botName, 
      port, 
      agentId, 
      modelId,
      customModel,
      useCustomModel,
      customProvider,
      customBaseUrl,
      customApiKey,
      appId, 
      appSecret,
      soulContent
    } = req.body
    
    const configPath = `${process.env.HOME}/.openclaw-${serviceId}/openclaw.json`
    
    // 读取现有配置
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    // 确保必要的配置结构存在
    if (!config.gateway) config.gateway = {}
    if (!config.models) config.models = { mode: 'merge', providers: {} }
    if (!config.models.providers) config.models.providers = {}
    if (!config.channels) config.channels = {}
    if (!config.channels.feishu) config.channels.feishu = { accounts: {}, groups: {} }
    if (!config.channels.feishu.accounts) config.channels.feishu.accounts = {}
    if (!config.agents) config.agents = { list: [] }
    if (!config.agents.list) config.agents.list = []
    
    // 更新配置
    if (port) config.gateway.port = port
    
    // 确定使用的模型
    let finalModel
    if (useCustomModel) {
      if (!customProvider || !customModel || !customBaseUrl || !customApiKey) {
        return res.status(400).json({ error: '自定义模型需要填写 Provider、模型 ID、Base URL 和 API Key' })
      }
      finalModel = `${customProvider}/${customModel}`
      
      // 添加或更新自定义 provider 配置
      if (!config.models) {
        config.models = { mode: 'merge', providers: {} }
      }
      if (!config.models.providers) {
        config.models.providers = {}
      }
      
      config.models.providers[customProvider] = {
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        auth: 'api-key',
        api: 'openai-completions',
        models: [
          {
            id: customModel,
            name: customModel,
            reasoning: false,
            input: ['text'],
            cost: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0
            },
            contextWindow: 128000,
            maxTokens: 8192
          }
        ]
      }
    } else {
      finalModel = modelId
    }
    
    if (agentId || finalModel) {
      config.agents.list = [{
        id: agentId || config.agents.list[0]?.id,
        model: finalModel || config.agents.list[0]?.model
      }]
    }
    
    // 更新飞书账号信息
    const accountKey = Object.keys(config.channels.feishu.accounts)[0] || serviceId
    if (config.channels.feishu.accounts[accountKey]) {
      if (botName) config.channels.feishu.accounts[accountKey].botName = botName
      if (appId) config.channels.feishu.accounts[accountKey].appId = appId
      if (appSecret) config.channels.feishu.accounts[accountKey].appSecret = appSecret
    }
    
    // 写入配置文件
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    
    // 更新 SOUL.md（即使内容为空也保存）
    if (soulContent !== undefined) {
      // 使用更新后的 agent ID（如果修改了）或现有的 agent ID
      const currentAgentId = (agentId && agentId.trim()) || config.agents.list[0]?.id || 'default'
      const agentConfigDir = `${process.env.HOME}/.openclaw-${serviceId}/agent-configs/${currentAgentId}`
      await fs.mkdir(agentConfigDir, { recursive: true })
      
      const soulPath = path.join(agentConfigDir, 'SOUL.md')
      await fs.writeFile(soulPath, soulContent || '# Agent 人格设定\n\n请编辑此文件定义 Agent 的人格特征。\n')
      console.log(`✅ SOUL.md 已更新: ${soulPath}`)
      console.log(`   Agent ID: ${currentAgentId}`)
      console.log(`   内容长度: ${soulContent?.length || 0} 字符`)
    }
    
    // 清除缓存
    cachedServices = []
    lastDiscoveryTime = 0
    
    res.json({ 
      success: true, 
      message: `Gateway ${serviceId} 更新成功`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除 Gateway
app.delete('/api/gateway/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const profileDir = `${process.env.HOME}/.openclaw-${serviceId}`
    
    // 先停止服务
    try {
      const plistFile = `${process.env.HOME}/Library/LaunchAgents/com.openclaw.${serviceId}.plist`
      await execAsync(`launchctl unload "${plistFile}" 2>/dev/null || true`)
      await fs.unlink(plistFile).catch(() => {})
    } catch {
      // 忽略停止服务的错误
    }
    
    // 删除配置目录
    await execAsync(`rm -rf "${profileDir}"`)
    
    // 清除缓存
    cachedServices = []
    lastDiscoveryTime = 0
    
    res.json({ 
      success: true, 
      message: `Gateway ${serviceId} 删除成功`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取可用的 Agent 列表
app.get('/api/agents', async (req, res) => {
  try {
    // 从默认配置中读取可用的 agents
    const defaultConfigPath = `${process.env.HOME}/.openclaw/openclaw.json`
    const configContent = await fs.readFile(defaultConfigPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    const agents = config.agents?.list || []
    
    res.json({ 
      success: true, 
      agents: agents
    })
  } catch (error) {
    // 返回默认列表
    res.json({ 
      success: true, 
      agents: [
        { id: 'main-agent', model: 'Claude Opus 4.6' },
        { id: 'content-agent', model: 'Claude Sonnet 4.5' },
        { id: 'tech-agent', model: 'Claude Sonnet 4.5 Thinking' },
      ]
    })
  }
})

// 获取可用的模型列表
app.get('/api/models', async (req, res) => {
  res.json({ 
    success: true, 
    models: [
      'Claude Opus 4.6',
      'Claude Opus 4.6 Thinking',
      'Claude Sonnet 4.5',
      'Claude Sonnet 4.5 Thinking',
      'Gemini 2.5 Flash',
      'Gemini 2.5 Pro',
      'GPT-4o',
      'GPT-4o-mini',
    ]
  })
})

app.listen(PORT, async () => {
  console.log(`🚀 OpenClaw Manager API 运行在 http://localhost:${PORT}`)
  console.log(`📡 正在自动发现 Gateway 实例...`)
  await getServices()
})
