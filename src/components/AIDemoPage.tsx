import React, { useState } from 'react'
import { createLLMInterface } from '@/api/llm-bridge'
import Button from '@/components/ui/Button'

const AIDemoPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [exportUrl, setExportUrl] = useState<string>('')

  const runDemo = async () => {
    setIsRunning(true)
    setResult('🚀 开始AI图像编辑演示...\n')
    
    try {
      const llm = createLLMInterface()
      
      // 演示场景：创建一个简单的Logo
      const steps = [
        '📐 设置画布尺寸为 400x400',
        '🎨 设置背景色为浅灰色',
        '📝 创建新的矢量图层',
        '🔵 绘制蓝色圆形背景',
        '✏️ 添加公司名称文本',
        '📄 添加标语文本',
        '📊 获取画布状态信息',
        '📋 获取图层列表',
        '💾 导出最终结果'
      ]

      let stepIndex = 0
      const updateResult = (message: string) => {
        setResult(prev => prev + `${message}\n`)
      }

      // 1. 设置画布
      updateResult(`${steps[stepIndex++]} ...`)
      const step1 = await llm.execute('setCanvasSize', { width: 400, height: 400 })
      updateResult(`✅ ${step1.message}`)

      // 2. 设置背景色
      updateResult(`${steps[stepIndex++]} ...`)
      const step2 = await llm.execute('setBackgroundColor', { color: '#f8f9fa' })
      updateResult(`✅ ${step2.message}`)

      // 3. 创建图层
      updateResult(`${steps[stepIndex++]} ...`)
      const step3 = await llm.execute('createLayer', { name: 'Logo图层', type: 'vector' })
      updateResult(`✅ ${step3.message}`)

      // 4. 绘制圆形背景
      updateResult(`${steps[stepIndex++]} ...`)
      const step4 = await llm.execute('drawCircle', {
        x: 200, y: 200, radius: 150,
        options: { fill: '#667eea', stroke: 'none' }
      })
      updateResult(`✅ ${step4.message}`)

      // 5. 添加公司名称
      updateResult(`${steps[stepIndex++]} ...`)
      const step5 = await llm.execute('addText', {
        text: 'AI Corp',
        x: 200, y: 180,
        options: { fontSize: 32, fill: '#ffffff', fontWeight: 'bold' }
      })
      updateResult(`✅ ${step5.message}`)

      // 6. 添加标语
      updateResult(`${steps[stepIndex++]} ...`)
      const step6 = await llm.execute('addText', {
        text: 'Future of Design',
        x: 200, y: 220,
        options: { fontSize: 14, fill: '#ffffff', fontWeight: 'normal' }
      })
      updateResult(`✅ ${step6.message}`)

      // 7. 获取画布状态
      updateResult(`${steps[stepIndex++]} ...`)
      const canvasState = await llm.execute('getCanvasState')
      updateResult(`✅ 画布尺寸: ${canvasState.data?.width}x${canvasState.data?.height}, 缩放: ${canvasState.data?.zoom}`)

      // 8. 获取图层列表
      updateResult(`${steps[stepIndex++]} ...`)
      const layerList = await llm.execute('getLayerList')
      updateResult(`✅ 图层数量: ${layerList.data?.layers?.length || 0}, 活动图层: ${layerList.data?.activeLayerId}`)

      // 9. 导出结果
      updateResult(`${steps[stepIndex++]} ...`)
      const exportResult = await llm.execute('exportCanvas', { format: 'png', quality: 1 })
      if (exportResult.success && exportResult.data?.dataURL) {
        setExportUrl(exportResult.data.dataURL)
        updateResult(`✅ 画布导出成功！`)
      } else {
        updateResult(`❌ 画布导出失败`)
      }

      updateResult('\n🎉 AI图像编辑演示完成！')
      updateResult('💡 这展示了LLM如何通过API控制图像编辑操作')
      
      llm.destroy()

    } catch (error) {
      setResult(prev => prev + `\n❌ 演示过程中出现错误: ${error}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const downloadResult = () => {
    if (exportUrl) {
      const link = document.createElement('a')
      link.download = `ai-demo-logo-${Date.now()}.png`
      link.href = exportUrl
      link.click()
    }
  }

  const clearResult = () => {
    setResult('')
    setExportUrl('')
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标题区 */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🤖 AI驱动图像编辑演示
          </h1>
          <p className="text-gray-600">
            展示LLM大模型如何通过API控制miniPaint进行图像编辑
          </p>
        </div>
      </div>

      {/* 控制区 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-center gap-4">
          <Button
            onClick={runDemo}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
          >
            {isRunning ? '🔄 演示进行中...' : '🚀 开始AI演示'}
          </Button>
          
          {exportUrl && (
            <Button
              onClick={downloadResult}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
            >
              📥 下载结果
            </Button>
          )}
          
          <Button
            onClick={clearResult}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2"
          >
            🗑️ 清空日志
          </Button>
        </div>
      </div>

      {/* 结果展示区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 日志区 */}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">执行日志</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-full overflow-auto font-mono text-sm">
            {result ? (
              <pre className="whitespace-pre-wrap">{result}</pre>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <p>点击"开始AI演示"按钮查看AI图像编辑过程</p>
                <p className="text-xs mt-2">演示将创建一个简单的公司Logo</p>
              </div>
            )}
          </div>
        </div>

        {/* 预览区 */}
        <div className="w-80 p-4 border-l border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">结果预览</h3>
          <div className="bg-gray-100 rounded-lg p-4 h-full flex items-center justify-center">
            {exportUrl ? (
              <div className="text-center">
                <img 
                  src={exportUrl} 
                  alt="AI生成的Logo" 
                  className="max-w-full max-h-64 rounded-lg shadow-lg mb-4"
                />
                <p className="text-sm text-gray-600">AI生成的Logo</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">🎨</span>
                </div>
                <p>运行演示后这里将显示结果</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 说明区 */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-blue-50">
        <div className="text-sm text-blue-800">
          <h4 className="font-semibold mb-2">💡 演示说明：</h4>
          <ul className="space-y-1 text-xs">
            <li>• 这个演示展示了LLM如何通过标准化API控制图像编辑</li>
            <li>• 每个步骤都是通过AI接口调用完成的，无需人工干预</li>
            <li>• 支持复杂的批量操作和错误处理机制</li>
            <li>• 可以轻松扩展到更复杂的设计场景</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AIDemoPage