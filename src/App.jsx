import { useState, useEffect } from 'react'

function App() {
  const [services, setServices] = useState([
    { id: 'main-assistant', name: '主助理', port: 18789, status: 'unknown', model: 'Claude Opus 4.6' },
    { id: 'content-creator', name: '内容创作助手', port: 18790, status: 'unknown', model: 'Claude Sonnet 4.5' },
    { id: 'tech-dev', name: '技术开发助手', port: 18791, status: 'unknown', model: 'Claude Sonnet 4.5 Thinking' },
    { id: 'ai-news', name: 'AI资讯助手', port: 18792, status: 'unknown', model: 'Gemini 2.5 Flash' },
  ])
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 检查服务状态
  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setServices(data.services)
    } catch (error) {
      setMessage('无法连接到后端服务')
    }
    setLoading(false)
  }

  // 启动所有服务
  const startAll = async () => {
    setLoading(true)
    setMessage('正在启动所有服务...')
    try {
      await fetch('/api/start-all', { method: 'POST' })
      setMessage('✅ 所有服务已启动')
      setTimeout(checkStatus, 2000)
    } catch (error) {
      setMessage('❌ 启动失败')
    }
    setLoading(false)
  }

  // 停止所有服务
  const stopAll = async () => {
    if (!confirm('确定要停止所有服务吗？')) return
    
    setLoading(true)
    setMessage('正在停止所有服务...')
    try {
      await fetch('/api/stop-all', { method: 'POST' })
      setMessage('✅ 所有服务已停止')
      setTimeout(checkStatus, 2000)
    } catch (error) {
      setMessage('❌ 停止失败')
    }
    setLoading(false)
  }

  // 重启所有服务
  const restartAll = async () => {
    setLoading(true)
    setMessage('正在重启所有服务...')
    try {
      await fetch('/api/restart-all', { method: 'POST' })
      setMessage('✅ 所有服务已重启')
      setTimeout(checkStatus, 2000)
    } catch (error) {
      setMessage('❌ 重启失败')
    }
    setLoading(false)
  }

  // 配置保活
  const setupLaunchd = async () => {
    if (!confirm('这将配置 launchd 保活服务，包括开机自启动和自动重启。是否继续？')) return
    
    setLoading(true)
    setMessage('正在配置保活服务...')
    try {
      await fetch('/api/setup-launchd', { method: 'POST' })
      setMessage('✅ 保活服务配置成功')
      setTimeout(checkStatus, 2000)
    } catch (error) {
      setMessage('❌ 配置失败')
    }
    setLoading(false)
  }

  // 刷新服务发现
  const refreshDiscovery = async () => {
    setLoading(true)
    setMessage('正在重新扫描 Gateway 实例...')
    try {
      const response = await fetch('/api/refresh-discovery', { method: 'POST' })
      const data = await response.json()
      setMessage(`✅ ${data.message}`)
      setTimeout(checkStatus, 1000)
    } catch (error) {
      setMessage('❌ 刷新失败')
    }
    setLoading(false)
  }

  // 页面加载时检查状态
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000) // 每10秒刷新
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'stopped': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return '运行中'
      case 'stopped': return '已停止'
      default: return '未知'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🦞</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">OpenClaw Manager</h1>
                <p className="text-sm text-gray-600">多 Gateway 管理面板 • 自动发现实例</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshDiscovery}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '扫描中...' : '🔍 重新扫描'}
              </button>
              <button
                onClick={checkStatus}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '刷新中...' : '刷新状态'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 消息提示 */}
        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={setupLaunchd}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            ⚙️ 配置保活
          </button>
          <button
            onClick={startAll}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            ▶️ 启动所有
          </button>
          <button
            onClick={stopAll}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            ⏹️ 停止所有
          </button>
          <button
            onClick={restartAll}
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
          >
            🔄 重启所有
          </button>
        </div>

        {/* 服务列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                  <span className="text-sm font-medium text-gray-700">{getStatusText(service.status)}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">端口:</span>
                  <span className="font-mono font-medium">{service.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">模型:</span>
                  <span className="font-medium">{service.model}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  查看日志
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  重启
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 系统信息 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">系统信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">总内存占用:</span>
              <span className="ml-2 font-medium">~1.6GB</span>
            </div>
            <div>
              <span className="text-gray-600">运行服务:</span>
              <span className="ml-2 font-medium">{services.filter(s => s.status === 'running').length} / {services.length}</span>
            </div>
            <div>
              <span className="text-gray-600">自动刷新:</span>
              <span className="ml-2 font-medium">每 10 秒</span>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 pb-8 text-center text-sm text-gray-600">
        <p>OpenClaw Manager v1.0 | Made with ❤️ by Maynor</p>
      </footer>
    </div>
  )
}

export default App
