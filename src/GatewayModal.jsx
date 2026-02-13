import { useState, useEffect } from 'react'

function GatewayModal({ isOpen, onClose, onSave, gateway, mode }) {
  const [formData, setFormData] = useState({
    profileId: '',
    botName: '',
    port: 18789,
    agentId: '',
    modelId: '',
    customModel: '',
    useCustomModel: false,
    appId: '',
    appSecret: '',
    soulContent: '',
  })

  const [models, setModels] = useState([])
  const [agents, setAgents] = useState([])
  const [showSoulEditor, setShowSoulEditor] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // 加载模型和 Agent 列表
      fetch('/api/models').then(r => r.json()).then(data => setModels(data.models))
      fetch('/api/agents').then(r => r.json()).then(data => setAgents(data.agents))
      
      // 如果是编辑模式，填充表单
      if (mode === 'edit' && gateway) {
        // 加载 SOUL.md 内容
        fetch(`/api/gateway/${gateway.id}/soul`)
          .then(r => r.json())
          .then(data => {
            setFormData(prev => ({
              ...prev,
              soulContent: data.content || ''
            }))
          })
          .catch(() => {})
        
        setFormData({
          profileId: gateway.id,
          botName: gateway.name,
          port: gateway.port,
          agentId: gateway.agent,
          modelId: gateway.model,
          customModel: '',
          useCustomModel: false,
          appId: '',
          appSecret: '',
          soulContent: '',
        })
      } else {
        // 新建模式，重置表单
        setFormData({
          profileId: '',
          botName: '',
          port: 18789,
          agentId: '',
          modelId: '',
          customModel: '',
          useCustomModel: false,
          appId: '',
          appSecret: '',
          soulContent: '# Agent 人格设定\n\n## 角色定位\n你是一个专业的 AI 助手。\n\n## 性格特点\n- 友好、专业\n- 乐于助人\n- 思维清晰\n\n## 工作方式\n- 认真倾听用户需求\n- 提供准确的信息\n- 保持礼貌和耐心\n',
        })
      }
    }
  }, [isOpen, mode, gateway])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) : value)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'edit' ? '编辑 Gateway' : '创建新 Gateway'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="profileId"
              value={formData.profileId}
              onChange={handleChange}
              disabled={mode === 'edit'}
              required
              placeholder="例如: my-assistant"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              唯一标识符，只能包含字母、数字和连字符
            </p>
          </div>

          {/* Bot 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              机器人名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="botName"
              value={formData.botName}
              onChange={handleChange}
              required
              placeholder="例如: 我的助手"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 端口 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              端口号 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="port"
              value={formData.port}
              onChange={handleChange}
              required
              min="1024"
              max="65535"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              建议使用 18789-18799 范围
            </p>
          </div>

          {/* Agent ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="agentId"
              value={formData.agentId}
              onChange={handleChange}
              required
              placeholder="例如: main-agent"
              list="agents-list"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <datalist id="agents-list">
              {agents.map(agent => (
                <option key={agent.id} value={agent.id} />
              ))}
            </datalist>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI 模型 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <select
                name="modelId"
                value={formData.modelId}
                onChange={handleChange}
                required={!formData.useCustomModel}
                disabled={formData.useCustomModel}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">选择预设模型</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="useCustomModel"
                  checked={formData.useCustomModel}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">使用自定义模型</label>
              </div>
              
              {formData.useCustomModel && (
                <input
                  type="text"
                  name="customModel"
                  value={formData.customModel}
                  onChange={handleChange}
                  required={formData.useCustomModel}
                  placeholder="例如: gpt-4o, claude-3-opus-20240229"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              自定义模型需要在 OpenClaw 配置中正确设置 API Key
            </p>
          </div>

          {/* 飞书 App ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              飞书 App ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="appId"
              value={formData.appId}
              onChange={handleChange}
              required={mode === 'create'}
              placeholder="cli_xxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 飞书 App Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              飞书 App Secret <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="appSecret"
              value={formData.appSecret}
              onChange={handleChange}
              required={mode === 'create'}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {mode === 'edit' && (
              <p className="mt-1 text-xs text-gray-500">
                留空则不修改
              </p>
            )}
          </div>

          {/* Agent 人格设定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Agent 人格设定 (SOUL.md)
              </label>
              <button
                type="button"
                onClick={() => setShowSoulEditor(!showSoulEditor)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showSoulEditor ? '收起编辑器' : '展开编辑器'}
              </button>
            </div>
            
            {showSoulEditor && (
              <div className="space-y-2">
                <textarea
                  name="soulContent"
                  value={formData.soulContent}
                  onChange={handleChange}
                  rows="12"
                  placeholder="使用 Markdown 格式定义 Agent 的人格、角色、行为方式等..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  💡 提示：使用 Markdown 格式，定义 Agent 的角色、性格、专业领域、回答风格等
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-medium mb-1">示例内容：</p>
                  <pre className="whitespace-pre-wrap">
# 专业助手

## 角色定位
你是一个专业的技术顾问，擅长软件开发和系统架构。

## 性格特点
- 严谨、专业
- 注重细节
- 善于分析问题

## 工作方式
- 先理解需求，再提供方案
- 给出具体可行的建议
- 必要时提供代码示例
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {mode === 'edit' ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GatewayModal
