import React, { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'

// 模拟DeepSeek适配器（避免OpenAI依赖问题）
interface DeepSeekMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface DeepSeekResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// 模拟DeepSeek适配器类
class MockDeepSeekAdapter {
  async executeNaturalLanguage(userInput: string): Promise<DeepSeekResult> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // 简单的指令解析逻辑
    const input = userInput.toLowerCase()
    
    if (input.includes('画布') || input.includes('canvas')) {
      if (input.includes('800') && input.includes('600')) {
        return {
          success: true,
          message: '✅ 已设置画布尺寸为800x600',
          data: { action: 'setCanvasSize', width: 800, height: 600 }
        }
      }
      return {
        success: true,
        message: '✅ 已设置画布尺寸为默认大小',
        data: { action: 'setCanvasSize', width: 600, height: 400 }
      }
    }
    
    if (input.includes('圆形') || input.includes('圆')) {
      const color = input.includes('红') ? '#ff0000' : 
                   input.includes('蓝') ? '#0000ff' : 
                   input.includes('绿') ? '#00ff00' : '#ff6b6b'
      return {
        success: true,
        message: `✅ 已绘制${input.includes('红') ? '红色' : input.includes('蓝') ? '蓝色' : input.includes('绿') ? '绿色' : '粉色'}圆形`,
        data: { action: 'drawCircle', x: 200, y: 200, radius: 80, color }
      }
    }
    
    if (input.includes('矩形') || input.includes('方形')) {
      const color = input.includes('红') ? '#ff0000' : 
                   input.includes('蓝') ? '#0000ff' : 
                   input.includes('绿') ? '#00ff00' : '#4ecdc4'
      return {
        success: true,
        message: `✅ 已绘制${input.includes('红') ? '红色' : input.includes('蓝') ? '蓝色' : input.includes('绿') ? '绿色' : '青色'}矩形`,
        data: { action: 'drawRectangle', x: 100, y: 100, width: 200, height: 150, color }
      }
    }
    
    if (input.includes('文字') || input.includes('文本') || input.includes('字')) {
      const text = input.match(/["'](.*?)["']/) ? input.match(/["'](.*?)["']/)![1] : 'AI Generated Text'
      return {
        success: true,
        message: `✅ 已添加文字："${text}"`,
        data: { action: 'addText', text, x: 200, y: 200 }
      }
    }
    
    if (input.includes('logo') || input.includes('标志')) {
      return {
        success: true,
        message: '✅ 已创建简单Logo设计',
        data: { action: 'createLogo', style: 'simple' }
      }
    }
    
    if (input.includes('背景') || input.includes('background')) {
      const color = input.includes('白') ? '#ffffff' : 
                   input.includes('黑') ? '#000000' : 
                   input.includes('蓝') ? '#f0f8ff' : '#f8f9fa'
      return {
        success: true,
        message: `✅ 已设置背景色`,
        data: { action: 'setBackgroundColor', color }
      }
    }
    
    // 默认响应
    return {
      success: true,
      message: `🤖 我理解了您的指令："${userInput}"，正在处理中...`,
      data: { action: 'general', input: userInput }
    }
  }

  getSuggestedPrompts(): string[] {
    return [
      "创建一个800x600的画布",
      "画一个红色圆形",
      "画一个蓝色矩形",
      "添加文字'Hello AI'",
      "设置白色背景",
      "创建一个简单的Logo",
      "画三个不同颜色的圆形",
      "制作一个彩虹效果"
    ]
  }

  destroy() {
    // 清理资源
  }
}

const DeepSeekChat: React.FC = () => {
  const [messages, setMessages] = useState<DeepSeekMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '🤖 DeepSeek AI助手已就绪！我可以帮您通过自然语言进行图像编辑。请描述您想要做什么，比如"画一个红色圆形"或"创建800x600的画布"。',
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MockDeepSeekAdapter>(new MockDeepSeekAdapter())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: DeepSeekMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsProcessing(true)

    // 添加用户消息
    addMessage('user', userMessage)

    try {
      // 调用DeepSeek适配器
      const result = await adapterRef.current.executeNaturalLanguage(userMessage)
      
      if (result.success) {
        addMessage('assistant', result.message)
        
        // 如果有具体的操作数据，显示详细信息
        if (result.data) {
          const actionInfo = `📋 执行操作: ${result.data.action}`
          addMessage('system', actionInfo)
        }
      } else {
        addMessage('assistant', `❌ 处理失败: ${result.error || result.message}`)
      }
    } catch (error) {
      addMessage('assistant', `❌ 发生错误: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setShowApiKeyInput(false)
      addMessage('system', `🔑 API Key已设置，DeepSeek功能已激活！`)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'system',
        content: '🤖 聊天记录已清空。我可以帮您通过自然语言进行图像编辑。',
        timestamp: Date.now()
      }
    ])
  }

  if (showApiKeyInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">DeepSeek AI 图像编辑</h2>
            <p className="text-gray-600 text-sm">请输入您的DeepSeek API Key来开始使用</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              />
            </div>
            
            <Button
              onClick={handleApiKeySubmit}
              disabled={!apiKey.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              开始使用
            </Button>
            
            <div className="text-center">
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                暂时跳过（使用模拟模式）
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <p className="text-xs text-yellow-800">
              💡 提示: 您可以在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline">DeepSeek官网</a> 获取API Key
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标题栏 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">🤖 DeepSeek AI 图像编辑</h2>
            <p className="text-sm text-gray-600">通过自然语言描述来创建和编辑图像</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearChat}
              className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1"
            >
              清空对话
            </Button>
            <Button
              onClick={() => setShowApiKeyInput(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
            >
              设置API
            </Button>
          </div>
        </div>
      </div>

      {/* 建议指令 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">💡 建议指令:</h3>
        <div className="flex flex-wrap gap-2">
          {adapterRef.current.getSuggestedPrompts().slice(0, 4).map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedPrompt(prompt)}
              className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 text-sm'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>DeepSeek正在思考...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="描述您想要做什么，比如：'画一个红色圆形' 或 '创建800x600的画布'..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6"
          >
            {isProcessing ? '处理中...' : '发送'}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 按 Enter 发送，Shift+Enter 换行
        </div>
      </div>
    </div>
  )
}

export default DeepSeekChat