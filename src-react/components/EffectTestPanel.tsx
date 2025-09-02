import React, { useState } from 'react'
import { useImageEffects } from '@/hooks/useImageEffects'
import { useCanvasStore } from '@/stores/canvas'
import { Button } from '@/components/ui'
import * as fabric from 'fabric'

const EffectTestPanel: React.FC = () => {
  const { fabricCanvas } = useCanvasStore()
  const { 
    applyEffectToSelection, 
    applyEffectToCanvas, 
    previewEffect, 
    isProcessing,
    supportedEffects 
  } = useImageEffects()
  
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const createTestImage = () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    // 创建一个测试图像
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 绘制彩色渐变
    const gradient = ctx.createLinearGradient(0, 0, 100, 100)
    gradient.addColorStop(0, '#ff0000')
    gradient.addColorStop(0.5, '#00ff00')
    gradient.addColorStop(1, '#0000ff')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 100, 100)

    // 添加到fabric canvas
    const img = new fabric.Image(canvas, {
      left: 100,
      top: 100,
      scaleX: 1,
      scaleY: 1,
    })

    fabricCanvas.add(img as any)
    fabricCanvas.setActiveObject(img as any)
    fabricCanvas.renderAll()
    
    addTestResult('✅ 测试图像已创建')
  }

  const testBasicEffects = async () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) {
      addTestResult('❌ 请先选择一个对象')
      return
    }

    const basicEffects = ['brightness', 'contrast', 'grayscale', 'invert', 'sepia']
    
    for (const effect of basicEffects) {
      try {
        const params: Record<string, any> = effect === 'brightness' ? { value: 20 } :
                                           effect === 'contrast' ? { value: 20 } : {}
        
        const success = await applyEffectToSelection(effect, params)
        if (success) {
          addTestResult(`✅ ${effect} 效果应用成功`)
        } else {
          addTestResult(`❌ ${effect} 效果应用失败`)
        }
        
        // 等待一下再测试下一个效果
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        addTestResult(`❌ ${effect} 效果出错: ${error}`)
      }
    }
  }

  const testPreviewFunction = async () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) {
      addTestResult('❌ 请先选择一个对象')
      return
    }

    try {
      const previewUrl = await previewEffect('blur', { radius: 3 })
      if (previewUrl) {
        addTestResult('✅ 预览功能正常工作')
      } else {
        addTestResult('❌ 预览功能返回空结果')
      }
    } catch (error) {
      addTestResult(`❌ 预览功能出错: ${error}`)
    }
  }

  const testCanvasEffects = async () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    try {
      const success = await applyEffectToCanvas('brightness', { value: 10 })
      if (success) {
        addTestResult('✅ 画布效果应用成功')
      } else {
        addTestResult('❌ 画布效果应用失败')
      }
    } catch (error) {
      addTestResult(`❌ 画布效果出错: ${error}`)
    }
  }

  const runAllEffectTests = async () => {
    setTestResults([])
    addTestResult('🚀 开始效果系统测试...')
    
    // 创建测试图像
    createTestImage()
    
    // 等待图像创建完成
    setTimeout(async () => {
      await testPreviewFunction()
      setTimeout(async () => {
        await testBasicEffects()
        setTimeout(async () => {
          await testCanvasEffects()
          addTestResult('✅ 所有效果测试完成!')
        }, 1000)
      }, 1000)
    }, 500)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">效果系统测试</h3>
        <p className="text-sm text-gray-600">
          测试图像效果功能是否正常工作
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <Button onClick={createTestImage} size="sm" className="w-full">
          创建测试图像
        </Button>
        <Button onClick={testPreviewFunction} size="sm" className="w-full">
          测试预览功能
        </Button>
        <Button onClick={testBasicEffects} size="sm" className="w-full">
          测试基础效果
        </Button>
        <Button onClick={testCanvasEffects} size="sm" className="w-full">
          测试画布效果
        </Button>
        <Button onClick={runAllEffectTests} variant="primary" className="w-full">
          运行所有测试
        </Button>
        <Button onClick={clearResults} variant="ghost" size="sm" className="w-full">
          清空结果
        </Button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-2">测试结果</h4>
        <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-sm text-gray-500">暂无测试结果</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded">
        <h4 className="font-medium text-green-900 mb-1">效果系统状态</h4>
        <div className="text-sm text-green-700 space-y-1">
          <div>支持效果: {supportedEffects.length}种</div>
          <div>处理状态: {isProcessing ? '处理中' : '空闲'}</div>
          <div>Canvas: {fabricCanvas ? '已初始化' : '未初始化'}</div>
        </div>
      </div>
    </div>
  )
}

export default EffectTestPanel