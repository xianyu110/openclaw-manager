import { useState, useEffect } from 'react'
import GatewayModal from './GatewayModal'
import LogViewer from './LogViewer'

function App() {
  const [services, setServices] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedGateway, setSelectedGateway] = useState(null)
  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

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

  // 打开创建 Gateway 模态框
  const openCreateModal = () => {
    setModalMode('create')
    setSelectedGateway(null)
    setModalOpen(true)
  }

  // 打开编辑 Gateway 模态框
  const openEditModal = (gateway) => {
    setModalMode('edit')
    setSelectedGateway(gateway)
    setModalOpen(true)
  }

  // 保存 Gateway（创建或更新）
  const handleSaveGateway = async (formData) => {
    setLoading(true)
    try {
      if (modalMode === 'create') {
        // 创建新 Gateway
        const response = await fetch('/api/gateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const data = await response.json()
        if (response.ok) {
          setMessage(`✅ ${data.message}`)
          setModalOpen(false)
          setTimeout(checkStatus, 1000)
        } else {
          setMessage(`❌ ${data.error}`)
        }
      } else {
        // 更新 Gateway
        const response = await fetch(`/api/gateway/${formData.profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const data = await response.json()
        if (response.ok) {
          setMessage(`✅ ${data.message}`)
          setModalOpen(false)
          setTimeout(checkStatus, 1000)
        } else {
          setMessage(`❌ ${data.error}`)
        }
      }
    } catch (error) {
      setMessage(`❌ 操作失败: ${error.message}`)
    }
    setLoading(false)
  }

  // 删除 Gateway
  const handleDeleteGateway = async (serviceId) => {
    if (!confirm(`确定要删除 Gateway "${serviceId}" 吗？\n\n这将删除配置文件和所有相关数据，操作不可恢复！`)) {
      return
    }
    
    setLoading(true)
    setMessage(`正在删除 ${serviceId}...`)
    try {
      const response = await fetch(`/api/gateway/${serviceId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(checkStatus, 1000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ 删除失败: ${error.message}`)
    }
    setLoading(false)
  }

  // 启动单个 Gateway
  const handleStartGateway = async (serviceId) => {
    setLoading(true)
    setMessage(`正在启动 ${serviceId}...`)
    try {
      const response = await fetch(`/api/start/${serviceId}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(checkStatus, 2000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ 启动失败: ${error.message}`)
    }
    setLoading(false)
  }

  // 停止单个 Gateway
  const handleStopGateway = async (serviceId) => {
    if (!confirm(`确定要停止 Gateway "${serviceId}" 吗？`)) {
      return
    }
    
    setLoading(true)
    setMessage(`正在停止 ${serviceId}...`)
    try {
      const response = await fetch(`/api/stop/${serviceId}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(checkStatus, 2000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ 停止失败: ${error.message}`)
    }
    setLoading(false)
  }

  // 重启单个 Gateway
  const handleRestartGateway = async (serviceId) => {
    setLoading(true)
    setMessage(`正在重启 ${serviceId}...`)
    try {
      const response = await fetch(`/api/restart/${serviceId}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(checkStatus, 3000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ 重启失败: ${error.message}`)
    }
    setLoading(false)
  }

  // 打开日志查看器
  const openLogViewer = (service) => {
    setSelectedService(service)
    setLogViewerOpen(true)
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
      {/* Gateway 管理模态框 */}
      <GatewayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveGateway}
        gateway={selectedGateway}
        mode={modalMode}
      />

      {/* 日志查看器 */}
      <LogViewer
        isOpen={logViewerOpen}
        onClose={() => setLogViewerOpen(false)}
        serviceId={selectedService?.id}
        serviceName={selectedService?.name}
      />

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
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={openCreateModal}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            ➕ 新建 Gateway
          </button>
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
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
                  <span className="font-medium">{typeof service.model === 'string' ? service.model : service.model?.primary || 'Unknown'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {/* 第一行：编辑和删除 */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditModal(service)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    ✏️ 编辑
                  </button>
                  <button 
                    onClick={() => handleDeleteGateway(service.id)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    🗑️ 删除
                  </button>
                </div>
                
                {/* 第二行：启动/停止/重启/日志 */}
                <div className="flex space-x-2">
                  {service.status === 'stopped' ? (
                    <button 
                      onClick={() => handleStartGateway(service.id)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      ▶️ 启动
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStopGateway(service.id)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      ⏹️ 停止
                    </button>
                  )}
                  <button 
                    onClick={() => handleRestartGateway(service.id)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    🔄 重启
                  </button>
                  <button 
                    onClick={() => openLogViewer(service)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    📝 日志
                  </button>
                </div>
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
