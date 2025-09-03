import React, { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { createLLMInterface } from '@/api/llm-bridge'
import type { AICommand } from '@/api/ai-interface'

// 真实的DeepSeek API调用
async function callDeepSeekAPI(apiKey: string, userInput: string): Promise<AICommand[]> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的图像编辑AI助手，能够将用户的自然语言描述转换为具体的图像编辑API调用。

可用的API命令包括：

**画布操作：**
- setCanvasSize(width, height) - 设置画布尺寸
- setBackgroundColor(color) - 设置背景色
- getCanvasState() - 获取画布状态
- exportCanvas(format, quality) - 导出画布

**图层管理：**
- createLayer(name, type) - 创建图层 (type: 'raster'|'vector'|'text')
- deleteLayer(layerId) - 删除图层
- setLayerOpacity(layerId, opacity) - 设置透明度 (0-100)

**绘图操作：**
- drawRectangle(x, y, width, height, options) - 绘制矩形
- drawCircle(x, y, radius, options) - 绘制圆形
- addText(text, x, y, options) - 添加文本
- loadImage(imageUrl, x, y) - 加载图像

**选项参数：**
- fill: 填充色 (如 '#ff0000', 'red', 'transparent')
- stroke: 边框色
- strokeWidth: 边框宽度
- fontSize: 字体大小
- fontFamily: 字体 ('Arial', 'Times', etc.)
- fontWeight: 字体粗细 ('normal', 'bold')

**响应格式：**
请以JSON格式返回命令列表，格式如下：
{
  "explanation": "操作说明",
  "commands": [
    {
      "action": "命令名",
      "parameters": { 参数对象 },
      "description": "步骤描述"
    }
  ]
}

请确保：
1. 坐标和尺寸合理（画布范围内）
2. 颜色格式正确（十六进制或颜色名）
3. 参数类型正确（数字、字符串、对象）
4. 操作顺序逻辑合理
5. 提供清晰的中文说明`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('DeepSeek返回空响应')
    }

    // 解析JSON响应
    const parsed = JSON.parse(content)
    return parsed.commands || []

  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}

// DeepSeek消息类型
interface DeepSeekMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'action'
  content: string
  timestamp: number
  data?: any
}

// 真实的DeepSeek集成组件
const DeepSeekIntegration: React.FC = () => {
  const [messages, setMessages] = useState<DeepSeekMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '🤖 DeepSeek AI图像编辑助手已就绪！\n\n我可以理解您的自然语言描述并转换为图像编辑操作。\n\n请告诉我您想要做什么，比如：\n• "创建一个800x600的画布"\n• "画一个红色圆形在中心"\n• "添加文字Hello World"\n• "设计一个简单的Logo"',
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const llmInterface = useRef(createLLMInterface())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (type: DeepSeekMessage['type'], content: string, data?: any) => {
    const newMessage: DeepSeekMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: Date.now(),
      data
    }
    setMessages(prev => [...prev, newMessage])
  }

  // 解析自然语言为API命令
  const parseNaturalLanguage = async (userInput: string): Promise<AICommand[]> => {
    if (apiKey) {
      // 使用真实的DeepSeek API
      try {
        return await callDeepSeekAPI(apiKey, userInput)
      } catch (error) {
        console.error('DeepSeek API调用失败，回退到基础模式:', error)
        // 回退到基础解析
      }
    }

    // 基础模式的简化解析逻辑
    const input = userInput.toLowerCase()
    const commands: AICommand[] = []

    // 画布设置
    if (input.includes('画布') || input.includes('canvas')) {
      const widthMatch = input.match(/(\d+)\s*[x×]\s*(\d+)/)
      if (widthMatch) {
        commands.push({
          action: 'setCanvasSize',
          parameters: {
            width: parseInt(widthMatch[1]),
            height: parseInt(widthMatch[2])
          },
          description: `设置画布尺寸为${widthMatch[1]}x${widthMatch[2]}`
        })
      } else {
        commands.push({
          action: 'setCanvasSize',
          parameters: { width: 800, height: 600 },
          description: '设置画布尺寸为默认800x600'
        })
      }
    }

    // 背景色设置
    if (input.includes('背景')) {
      let color = '#ffffff'
      if (input.includes('白')) color = '#ffffff'
      else if (input.includes('黑')) color = '#000000'
      else if (input.includes('红')) color = '#ffebee'
      else if (input.includes('蓝')) color = '#e3f2fd'
      else if (input.includes('绿')) color = '#e8f5e8'
      else if (input.includes('灰')) color = '#f5f5f5'
      
      commands.push({
        action: 'setBackgroundColor',
        parameters: { color },
        description: `设置背景色为${color}`
      })
    }

    // 圆形绘制
    if (input.includes('圆') || input.includes('circle')) {
      let fill = '#ff6b6b'
      if (input.includes('红')) fill = '#ff0000'
      else if (input.includes('蓝')) fill = '#0000ff'
      else if (input.includes('绿')) fill = '#00ff00'
      else if (input.includes('黄')) fill = '#ffff00'
      else if (input.includes('紫')) fill = '#800080'

      const posMatch = input.match(/(\d+)\s*[,，]\s*(\d+)/)
      const radiusMatch = input.match(/半径\s*(\d+)|大小\s*(\d+)|radius\s*(\d+)/i)
      
      const x = posMatch ? parseInt(posMatch[1]) : 200
      const y = posMatch ? parseInt(posMatch[2]) : 200
      const radius = radiusMatch ? parseInt(radiusMatch[1] || radiusMatch[2] || radiusMatch[3]) : 80

      commands.push({
        action: 'drawCircle',
        parameters: {
          x, y, radius,
          options: { fill, stroke: '#333333', strokeWidth: 2 }
        },
        description: `在(${x}, ${y})绘制半径${radius}的圆形`
      })
    }

    // 矩形绘制
    if (input.includes('矩形') || input.includes('方形') || input.includes('rectangle')) {
      let fill = '#4ecdc4'
      if (input.includes('红')) fill = '#ff0000'
      else if (input.includes('蓝')) fill = '#0000ff'
      else if (input.includes('绿')) fill = '#00ff00'
      else if (input.includes('黄')) fill = '#ffff00'

      const posMatch = input.match(/(\d+)\s*[,，]\s*(\d+)/)
      const sizeMatch = input.match(/(\d+)\s*[x×]\s*(\d+)/)
      
      const x = posMatch ? parseInt(posMatch[1]) : 100
      const y = posMatch ? parseInt(posMatch[2]) : 100
      const width = sizeMatch ? parseInt(sizeMatch[1]) : 200
      const height = sizeMatch ? parseInt(sizeMatch[2]) : 150

      commands.push({
        action: 'drawRectangle',
        parameters: {
          x, y, width, height,
          options: { fill, stroke: '#333333', strokeWidth: 2 }
        },
        description: `在(${x}, ${y})绘制${width}x${height}的矩形`
      })
    }

    // 文字添加
    if (input.includes('文字') || input.includes('文本') || input.includes('text')) {
      const textMatch = input.match(/[""']([^""']+)[""']/) ||
                       input.match(/文字\s*[:：]\s*([^\s,，。.]+)/) ||
                       input.match(/text\s*[:：]\s*([^\s,，。.]+)/i)
      
      const text = textMatch ? textMatch[1] : 'AI Generated Text'
      const posMatch = input.match(/(\d+)\s*[,，]\s*(\d+)/)
      const sizeMatch = input.match(/大小\s*(\d+)|字号\s*(\d+)|size\s*(\d+)/i)
      
      const x = posMatch ? parseInt(posMatch[1]) : 200
      const y = posMatch ? parseInt(posMatch[2]) : 200
      const fontSize = sizeMatch ? parseInt(sizeMatch[1] || sizeMatch[2] || sizeMatch[3]) : 24

      commands.push({
        action: 'addText',
        parameters: {
          text, x, y,
          options: {
            fontSize,
            fontFamily: 'Arial',
            fill: '#333333',
            fontWeight: input.includes('粗体') || input.includes('bold') ? 'bold' : 'normal'
          }
        },
        description: `在(${x}, ${y})添加文字："${text}"`
      })
    }

    // Logo设计
    if (input.includes('logo') || input.includes('标志')) {
      const companyMatch = input.match(/公司[""']([^""']+)[""']/) ||
                          input.match(/名称[""']([^""']+)[""']/) ||
                          input.match(/[""']([^""']+)[""']\s*logo/i)
      
      const companyName = companyMatch ? companyMatch[1] : 'AI Corp'
      
      commands.push(
        {
          action: 'setCanvasSize',
          parameters: { width: 400, height: 400 },
          description: '设置Logo画布尺寸'
        },
        {
          action: 'drawCircle',
          parameters: {
            x: 200, y: 200, radius: 150,
            options: { fill: '#667eea', stroke: 'none' }
          },
          description: '绘制Logo背景圆形'
        },
        {
          action: 'addText',
          parameters: {
            text: companyName,
            x: 200, y: 180,
            options: { fontSize: 32, fill: '#ffffff', fontWeight: 'bold' }
          },
          description: `添加公司名称：${companyName}`
        },
        {
          action: 'addText',
          parameters: {
            text: 'Future of Design',
            x: 200, y: 220,
            options: { fontSize: 14, fill: '#ffffff', fontWeight: 'normal' }
          },
          description: '添加Logo标语'
        }
      )
    }

    return commands
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsProcessing(true)

    // 添加用户消息
    addMessage('user', userMessage)

    try {
      // 解析自然语言为API命令
      if (apiKey) {
        addMessage('system', '🤖 DeepSeek AI正在理解您的指令...')
      } else {
        addMessage('system', '🔄 基础模式正在解析您的指令...')
      }
      
      const commands = await parseNaturalLanguage(userMessage)
      
      if (commands.length === 0) {
        addMessage('assistant', '🤔 抱歉，我没有理解您的指令。请尝试更具体的描述，比如"画一个红色圆形"或"创建800x600的画布"。')
        return
      }

      addMessage('system', `📋 解析完成，将执行 ${commands.length} 个操作：\n${commands.map(cmd => `• ${cmd.description}`).join('\n')}`)

      // 执行API命令
      addMessage('system', '⚡ 正在执行操作...')
      const results = await llmInterface.current.executeBatch(commands)
      
      const successCount = results.filter(r => r.success).length
      const failedCount = results.length - successCount

      if (failedCount === 0) {
        addMessage('assistant', `✅ 完美！已成功执行所有 ${successCount} 个操作。您的图像编辑指令已完成！`)
        
        // 显示执行详情
        const details = results.map((result, index) => 
          `${index + 1}. ${commands[index].description}: ${result.success ? '✅' : '❌'} ${result.message}`
        ).join('\n')
        
        addMessage('action', `📊 执行详情：\n${details}`)
      } else {
        addMessage('assistant', `⚠️ 部分操作完成：${successCount} 成功，${failedCount} 失败。`)
        
        const failedDetails = results
          .map((result, index) => ({ result, command: commands[index], index }))
          .filter(({ result }) => !result.success)
          .map(({ result, command, index }) => 
            `${index + 1}. ${command.description}: ❌ ${result.message}`
          ).join('\n')
        
        addMessage('action', `❌ 失败的操作：\n${failedDetails}`)
      }

    } catch (error) {
      addMessage('assistant', `❌ 处理过程中发生错误：${error}`)
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

  const getSuggestedPrompts = (): string[] => [
    "创建一个800x600的画布，背景设为浅蓝色",
    "画一个红色圆形在画布中心",
    "添加文字'Hello AI'在坐标(200,100)",
    "创建一个Logo，公司名称'TechCorp'",
    "画三个不同颜色的矩形，水平排列",
    "设计一个简单的名片：白色背景，黑色边框",
    "制作一个彩虹：画7个不同颜色的圆形",
    "创建一个进度条：灰色背景，绿色填充"
  ]

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'system',
        content: '🤖 对话已清空。我可以继续帮您进行图像编辑操作。',
        timestamp: Date.now()
      }
    ])
  }

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setShowApiKeyInput(false)
      addMessage('system', `🔑 DeepSeek API Key已设置！现在可以使用完整的AI功能了。`)
    }
  }

  if (showApiKeyInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">DeepSeek AI 集成</h2>
            <p className="text-gray-600 text-sm">输入DeepSeek API Key启用AI功能，或跳过使用基础模式</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key (可选)
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
            
            <div className="flex gap-2">
              <Button
                onClick={handleApiKeySubmit}
                disabled={!apiKey.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                启用完整功能
              </Button>
              <Button
                onClick={() => setShowApiKeyInput(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                基础模式
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              💡 基础模式使用内置规则解析，DeepSeek API可提供更强大的AI理解能力
            </p>
            <p className="text-xs text-blue-600 mt-1">
              获取API Key: <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline">platform.deepseek.com</a>
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
            <p className="text-sm text-gray-600">
              {apiKey ? '🤖 DeepSeek AI已启用' : '⚙️ 基础模式 - 内置指令解析'}
            </p>
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
              {apiKey ? '更换API' : '设置API'}
            </Button>
          </div>
        </div>
      </div>

      {/* 建议指令 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">💡 试试这些指令:</h3>
        <div className="grid grid-cols-2 gap-2">
          {getSuggestedPrompts().slice(0, 4).map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedPrompt(prompt)}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
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
                  ? 'bg-yellow-100 text-yellow-800 text-sm'
                  : message.type === 'action'
                  ? 'bg-green-100 text-green-800 text-sm font-mono'
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
                <span>AI正在处理您的指令...</span>
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
            placeholder="用自然语言描述您想要做什么，比如：'画一个红色圆形' 或 '创建一个Logo'"
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
          💡 按 Enter 发送，Shift+Enter 换行 | 支持中文自然语言指令
        </div>
      </div>
    </div>
  )
}

export default DeepSeekIntegration