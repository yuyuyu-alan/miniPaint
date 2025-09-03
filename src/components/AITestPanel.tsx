import React, { useState, useRef } from 'react'
import { aiImageEditor } from '@/api/ai-interface'
import { createLLMInterface } from '@/api/llm-bridge'
import Button from '@/components/ui/Button'
import AIDemoPage from '@/components/AIDemoPage'
import DeepSeekIntegration from '@/components/DeepSeekIntegration'

interface TestResult {
  id: string
  command: string
  success: boolean
  message: string
  timestamp: number
}

const AITestPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'chat' | 'test'>('demo')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [customCommand, setCustomCommand] = useState('')
  const [customParams, setCustomParams] = useState('{}')
  const llmRef = useRef(createLLMInterface())

  const addTestResult = (command: string, success: boolean, message: string) => {
    const result: TestResult = {
      id: Date.now().toString(),
      command,
      success,
      message,
      timestamp: Date.now()
    }
    setTestResults(prev => [result, ...prev.slice(0, 19)]) // 保持最新20条
  }

  // 基础功能测试
  const runBasicTests = async () => {
    setIsRunning(true)
    addTestResult('开始测试', true, '开始执行基础功能测试...')

    try {
      // 1. 设置画布
      const result1 = await aiImageEditor.setCanvasSize(800, 600)
      addTestResult('setCanvasSize', result1.success, result1.message)

      // 2. 设置背景色
      const result2 = await aiImageEditor.setBackgroundColor('#f0f8ff')
      addTestResult('setBackgroundColor', result2.success, result2.message)

      // 3. 创建图层
      const result3 = await aiImageEditor.createLayer('测试图层', 'vector')
      addTestResult('createLayer', result3.success, result3.message)

      // 4. 绘制矩形
      const result4 = await aiImageEditor.drawRectangle(100, 100, 200, 150, {
        fill: '#ff6b6b',
        stroke: '#333333',
        strokeWidth: 2
      })
      addTestResult('drawRectangle', result4.success, result4.message)

      // 5. 绘制圆形
      const result5 = await aiImageEditor.drawCircle(400, 200, 80, {
        fill: '#4ecdc4',
        stroke: '#333333',
        strokeWidth: 2
      })
      addTestResult('drawCircle', result5.success, result5.message)

      // 6. 添加文本
      const result6 = await aiImageEditor.addText('AI Test', 300, 400, {
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#333333',
        fontWeight: 'bold'
      })
      addTestResult('addText', result6.success, result6.message)

      addTestResult('测试完成', true, '✅ 基础功能测试全部完成！')

    } catch (error) {
      addTestResult('测试错误', false, `❌ 测试过程中出现错误: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  // 自定义命令测试
  const runCustomCommand = async () => {
    if (!customCommand.trim()) {
      addTestResult('自定义命令', false, '请输入命令名称')
      return
    }

    setIsRunning(true)
    try {
      const params = JSON.parse(customParams)
      const llm = llmRef.current
      const result = await llm.execute(customCommand, params)
      addTestResult(`自定义-${customCommand}`, result.success, result.message)
    } catch (error) {
      addTestResult('自定义命令错误', false, `❌ 自定义命令执行失败: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  // 清空测试结果
  const clearResults = () => {
    setTestResults([])
  }

  // 导出画布
  const exportCanvas = async () => {
    try {
      const result = await aiImageEditor.exportCanvas('png', 1)
      if (result.success && result.data?.dataURL) {
        // 创建下载链接
        const link = document.createElement('a')
        link.download = `ai-test-${Date.now()}.png`
        link.href = result.data.dataURL
        link.click()
        addTestResult('导出画布', true, '✅ 画布导出成功！')
      } else {
        addTestResult('导出画布', false, '❌ 画布导出失败')
      }
    } catch (error) {
      addTestResult('导出错误', false, `❌ 导出过程中出现错误: ${error}`)
    }
  }

  const TestContent = () => (
    <div className="h-full flex flex-col">
      {/* 控制按钮区 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={runBasicTests}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isRunning ? '测试中...' : '基础功能测试'}
          </Button>
          <Button
            onClick={exportCanvas}
            disabled={isRunning}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            导出画布
          </Button>
        </div>

        {/* 自定义命令区 */}
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">自定义命令测试</h3>
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              placeholder="命令名称 (如: drawRectangle)"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <textarea
              placeholder='参数 JSON (如: {"x": 100, "y": 100, "width": 200, "height": 150})'
              value={customParams}
              onChange={(e) => setCustomParams(e.target.value)}
              rows={2}
              className="px-3 py-2 border border-gray-300 rounded text-sm font-mono"
            />
            <div className="flex gap-2">
              <Button
                onClick={runCustomCommand}
                disabled={isRunning}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
              >
                执行自定义命令
              </Button>
              <Button
                onClick={clearResults}
                className="bg-gray-500 hover:bg-gray-600 text-white text-sm"
              >
                清空结果
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 测试结果区 */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">测试结果 ({testResults.length})</h3>
        <div className="space-y-2">
          {testResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>暂无测试结果</p>
              <p className="text-sm mt-1">点击上方按钮开始测试</p>
            </div>
          ) : (
            testResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.command}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标题栏和标签页 */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800">🤖 AI图像编辑</h2>
          <p className="text-sm text-gray-600 mt-1">AI驱动的图像编辑功能</p>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'demo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎨 演示
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🤖 DeepSeek
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'test'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🧪 测试
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'demo' && <AIDemoPage />}
        {activeTab === 'chat' && <DeepSeekIntegration />}
        {activeTab === 'test' && <TestContent />}
      </div>
    </div>
  )
}

export default AITestPanel