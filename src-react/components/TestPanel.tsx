import React, { useState } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import { useToolStore } from '@/stores/tools'
import { useLayerStore } from '@/stores/layers'
import { Button } from '@/components/ui'
import * as fabric from 'fabric'

const TestPanel: React.FC = () => {
  const { fabricCanvas } = useCanvasStore()
  const { saveState, undo, redo, canUndo, canRedo, getHistorySize } = useHistoryStore()
  const { activeTool, setActiveTool } = useToolStore()
  const { layers, addLayer } = useLayerStore()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testHistorySystem = () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    // 先保存初始状态
    saveState('初始状态')
    
    setTimeout(() => {
      // 添加测试对象
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 50,
        height: 50,
        fill: 'red'
      })
      
      fabricCanvas.add(rect)
      fabricCanvas.renderAll()
      
      // 保存添加矩形后的状态
      setTimeout(() => {
        saveState('测试添加矩形')
        
        setTimeout(() => {
          const historyStore = useHistoryStore.getState()
          if (historyStore.canUndo()) {
            const undoResult = historyStore.undo()
            if (undoResult) {
              addTestResult('✅ 历史记录系统正常 - 撤销成功')
              
              setTimeout(() => {
                const historyStore2 = useHistoryStore.getState()
                if (historyStore2.canRedo()) {
                  const redoResult = historyStore2.redo()
                  if (redoResult) {
                    addTestResult('✅ 历史记录系统正常 - 重做成功')
                  } else {
                    addTestResult('❌ 重做执行失败')
                  }
                } else {
                  addTestResult('❌ 重做功能不可用')
                }
              }, 200)
            } else {
              addTestResult('❌ 撤销执行失败')
            }
          } else {
            addTestResult(`❌ 撤销功能不可用 - 历史记录数量: ${historyStore.getHistorySize()}`)
          }
        }, 200)
      }, 200)
    }, 100)
  }

  const testToolSystem = () => {
    const tools = ['brush', 'rectangle', 'circle', 'text', 'crop', 'fill', 'erase', 'clone'] as const
    
    tools.forEach((tool, index) => {
      setTimeout(() => {
        setActiveTool(tool)
        // 给状态更新一些时间
        setTimeout(() => {
          const currentTool = useToolStore.getState().activeTool
          if (currentTool === tool) {
            addTestResult(`✅ 工具切换成功: ${tool}`)
          } else {
            addTestResult(`❌ 工具切换失败: ${tool} (当前: ${currentTool})`)
          }
        }, 50)
      }, index * 300)
    })
  }

  const testLayerSystem = () => {
    const initialLayerCount = layers.length
    
    addLayer({
      name: '测试图层',
      visible: true,
      opacity: 100,
      locked: false,
      type: 'vector'
    })
    
    setTimeout(() => {
      const currentLayers = useLayerStore.getState().layers
      if (currentLayers.length > initialLayerCount) {
        addTestResult('✅ 图层系统正常 - 添加图层成功')
      } else {
        addTestResult(`❌ 图层系统异常 - 添加图层失败 (初始: ${initialLayerCount}, 当前: ${currentLayers.length})`)
      }
    }, 200)
  }

  const testPerformance = () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    const startTime = performance.now()
    
    // 添加大量对象测试性能
    const objects: fabric.Object[] = []
    for (let i = 0; i < 100; i++) {
      objects.push(new fabric.Circle({
        left: Math.random() * 500,
        top: Math.random() * 400,
        radius: 5,
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
    }
    
    // 批量添加
    objects.forEach(obj => fabricCanvas.add(obj))
    fabricCanvas.renderAll()
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    addTestResult(`✅ 性能测试完成 - 添加100个对象耗时: ${duration.toFixed(2)}ms`)
    
    // 清理测试对象
    setTimeout(() => {
      objects.forEach(obj => fabricCanvas.remove(obj))
      fabricCanvas.renderAll()
      addTestResult('✅ 测试对象已清理')
    }, 2000)
  }

  const runAllTests = () => {
    setTestResults([])
    addTestResult('🚀 开始运行所有测试...')
    
    testHistorySystem()
    setTimeout(() => testToolSystem(), 1000)
    setTimeout(() => testLayerSystem(), 3000)
    setTimeout(() => testPerformance(), 4000)
    
    setTimeout(() => {
      addTestResult('✅ 所有测试完成!')
    }, 6000)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">功能测试面板</h3>
        <p className="text-sm text-gray-600">
          测试新实现的功能是否正常工作
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <Button onClick={testHistorySystem} size="sm" className="w-full">
          测试历史记录系统
        </Button>
        <Button onClick={testToolSystem} size="sm" className="w-full">
          测试工具系统
        </Button>
        <Button onClick={testLayerSystem} size="sm" className="w-full">
          测试图层系统
        </Button>
        <Button onClick={testPerformance} size="sm" className="w-full">
          测试性能优化
        </Button>
        <Button onClick={runAllTests} variant="primary" className="w-full">
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

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-900 mb-1">系统状态</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>当前工具: {activeTool}</div>
          <div>图层数量: {layers.length}</div>
          <div>历史记录: {getHistorySize()}</div>
          <div>Canvas: {fabricCanvas ? '已初始化' : '未初始化'}</div>
        </div>
      </div>
    </div>
  )
}

export default TestPanel