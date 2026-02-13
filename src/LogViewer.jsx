import { useState, useEffect, useRef } from 'react'

function LogViewer({ isOpen, onClose, serviceId, serviceName }) {
  const [logs, setLogs] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !serviceId) return

    // 初始加载日志
    fetchLogs()

    // 每2秒刷新一次
    const interval = setInterval(fetchLogs, 2000)

    return () => clearInterval(interval)
  }, [isOpen, serviceId])

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs/${serviceId}`)
      const data = await response.json()
      if (data.logs) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('获取日志失败:', error)
    }
  }

  const clearLogs = () => {
    setLogs('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] mx-4 flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              📝 {serviceName || serviceId} - 实时日志
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              最近 100 行 • 每 2 秒自动刷新
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* 工具栏 */}
        <div className="px-6 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchLogs}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              🔄 刷新
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              🗑️ 清空显示
            </button>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span>自动滚动</span>
            </label>
          </div>
          <div className="text-sm text-gray-400">
            {logs.split('\n').length} 行
          </div>
        </div>

        {/* 日志内容 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
            {logs || '暂无日志...'}
            <div ref={logEndRef} />
          </pre>
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-800">
          <p className="text-xs text-gray-400">
            💡 提示：日志文件位置 ~/.openclaw-{serviceId}/stdout.log
          </p>
        </div>
      </div>
    </div>
  )
}

export default LogViewer
