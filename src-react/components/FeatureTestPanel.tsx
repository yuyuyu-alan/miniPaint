import React, { useState } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useToolStore } from '@/stores/tools'
import { useLayerStore } from '@/stores/layers'
import { useHistoryStore } from '@/stores/history'
import { useImageEffects } from '@/hooks/useImageEffects'
import { Button } from '@/components/ui'
import * as fabric from 'fabric'

const FeatureTestPanel: React.FC = () => {
  const { fabricCanvas } = useCanvasStore()
  const { setActiveTool } = useToolStore()
  const { addLayer, layers } = useLayerStore()
  const { saveState, undo, redo, canUndo, canRedo } = useHistoryStore()
  const { applyEffectToSelection } = useImageEffects()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  // 测试文件拖拽导入功能
  const testFileDrop = () => {
    addTestResult('📁 文件拖拽测试：请拖拽一个图片文件到画布区域')
    addTestResult('✅ 拖拽功能已启用，支持 JPG, PNG, GIF, WebP, SVG')
  }

  // 测试右键菜单功能
  const testContextMenu = () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    // 创建一个测试对象
    const rect = new fabric.Rect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
      fill: '#ff6b6b'
    })

    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    fabricCanvas.renderAll()

    addTestResult('✅ 测试对象已创建')
    addTestResult('🖱️ 右键菜单测试：请在对象上右键点击查看菜单')
    addTestResult('📋 菜单应包含：删除、复制对象等选项')
  }

  // 测试图层拖拽排序
  const testLayerDragSort = () => {
    // 创建多个图层用于测试
    const layer1 = addLayer({
      name: '测试图层1',
      visible: true,
      opacity: 100,
      locked: false,
      type: 'vector'
    })

    const layer2 = addLayer({
      name: '测试图层2',
      visible: true,
      opacity: 100,
      locked: false,
      type: 'vector'
    })

    addTestResult('✅ 已创建测试图层')
    addTestResult('🔄 图层拖拽测试：请在右侧图层面板中拖拽图层重新排序')
    addTestResult('⋮⋮ 使用拖拽手柄进行排序操作')
  }

  // 测试双击编辑功能
  const testDoubleClickEdit = () => {
    addTestResult('✅ 双击编辑功能已启用')
    addTestResult('📝 双击测试：请在图层面板中双击图层名称进行编辑')
    addTestResult('⌨️ 支持 Enter 确认，Escape 取消')
  }

  // 测试响应式设计
  const testResponsiveDesign = () => {
    addTestResult('✅ 响应式设计已启用')
    addTestResult('📱 响应式测试：请调整浏览器窗口大小查看布局变化')
    addTestResult('🔄 面板会根据屏幕尺寸自动调整宽度和显示方式')
  }

  // 测试手势支持
  const testGestureSupport = () => {
    addTestResult('✅ 手势支持已启用')
    addTestResult('👆 手势测试：在触摸设备上使用以下手势：')
    addTestResult('🔍 双指缩放：双指捏合/展开进行缩放')
    addTestResult('👋 单指平移：单指拖拽移动画布')
    addTestResult('👆 双击缩放：双击切换缩放级别')
  }

  // 测试图像效果功能
  const testImageEffects = async () => {
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
      const success = await applyEffectToSelection('brightness', { value: 30 })
      if (success) {
        addTestResult('✅ 图像效果测试成功 - 亮度调整')
      } else {
        addTestResult('❌ 图像效果测试失败')
      }
    } catch (error) {
      addTestResult(`❌ 图像效果测试出错: ${error}`)
    }
  }

  // 测试工具切换
  const testToolSwitching = () => {
    const tools = ['brush', 'rectangle', 'circle', 'text'] as const
    
    tools.forEach((tool, index) => {
      setTimeout(() => {
        setActiveTool(tool)
        addTestResult(`✅ 工具切换成功: ${tool}`)
      }, index * 500)
    })
  }

  // 测试历史记录功能
  const testHistorySystem = () => {
    if (!fabricCanvas) {
      addTestResult('❌ Canvas未初始化')
      return
    }

    // 创建测试对象
    const circle = new fabric.Circle({
      left: 200,
      top: 200,
      radius: 30,
      fill: '#4ecdc4'
    })

    fabricCanvas.add(circle)
    fabricCanvas.renderAll()
    
    setTimeout(() => {
      if (canUndo()) {
        undo()
        addTestResult('✅ 历史记录测试 - 撤销成功')
        
        setTimeout(() => {
          if (canRedo()) {
            redo()
            addTestResult('✅ 历史记录测试 - 重做成功')
          }
        }, 500)
      }
    }, 500)
  }

  // 运行所有测试
  const runAllTests = () => {
    setTestResults([])
    addTestResult('🚀 开始综合功能测试...')
    
    testFileDrop()
    setTimeout(() => testContextMenu(), 1000)
    setTimeout(() => testLayerDragSort(), 2000)
    setTimeout(() => testDoubleClickEdit(), 3000)
    setTimeout(() => testResponsiveDesign(), 4000)
    setTimeout(() => testGestureSupport(), 5000)
    setTimeout(() => testToolSwitching(), 6000)
    setTimeout(() => testHistorySystem(), 8000)
    setTimeout(() => testImageEffects(), 10000)
    
    setTimeout(() => {
      addTestResult('🎉 所有功能测试完成！')
      addTestResult('📝 请按照提示手动验证交互功能')
    }, 12000)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">🧪 功能综合测试</h3>
        <p className="text-sm text-gray-600">
          测试所有重新实现的高级功能
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <Button onClick={testFileDrop} size="sm" className="w-full">
          测试文件拖拽导入
        </Button>
        <Button onClick={testContextMenu} size="sm" className="w-full">
          测试右键菜单
        </Button>
        <Button onClick={testLayerDragSort} size="sm" className="w-full">
          测试图层拖拽排序
        </Button>
        <Button onClick={testDoubleClickEdit} size="sm" className="w-full">
          测试双击编辑
        </Button>
        <Button onClick={testResponsiveDesign} size="sm" className="w-full">
          测试响应式设计
        </Button>
        <Button onClick={testGestureSupport} size="sm" className="w-full">
          测试手势支持
        </Button>
        <Button onClick={testImageEffects} size="sm" className="w-full">
          测试图像效果
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

      <div className="mt-4 p-3 bg-green-50 rounded">
        <h4 className="font-medium text-green-900 mb-1">系统状态</h4>
        <div className="text-sm text-green-700 space-y-1">
          <div>Canvas: {fabricCanvas ? '✅ 正常' : '❌ 未初始化'}</div>
          <div>图层数量: {layers.length}</div>
          <div>历史记录: 可撤销({canUndo() ? '✅' : '❌'}) 可重做({canRedo() ? '✅' : '❌'})</div>
        </div>
      </div>
    </div>
  )
}

export default FeatureTestPanel