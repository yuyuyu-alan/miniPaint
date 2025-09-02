import React, { useEffect, useRef } from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { useActiveTool, useBrushTool, useRectangleTool } from '@/hooks/useTool'
import { useHistory } from '@/hooks/useHistory'
import { useUIStore } from '@/stores/ui'

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  const { 
    canvasRef, 
    initCanvas, 
    width, 
    height,
    clearCanvas,
    exportCanvas 
  } = useCanvas()
  
  const { isActive: isBrushActive, activate: activateBrush } = useBrushTool()
  const { isActive: isRectActive, activate: activateRect } = useRectangleTool()
  const activeTool = useActiveTool()
  
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    saveStateImmediate,
    initHistory 
  } = useHistory()
  
  const { theme, setTheme } = useUIStore()

  // 初始化画布
  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = initCanvas()
      if (fabricCanvas) {
        // 初始化历史记录
        setTimeout(() => {
          initHistory()
        }, 100)
      }
    }
  }, [initCanvas, initHistory])

  const handleSaveState = () => {
    saveStateImmediate('手动保存')
  }

  const handleExport = () => {
    const dataURL = exportCanvas('png')
    if (dataURL) {
      const link = document.createElement('a')
      link.download = 'canvas-export.png'
      link.href = dataURL
      link.click()
    }
  }

  return (
    <div className="app-layout">
      {/* 头部工具栏 */}
      <header className="flex-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">
            🎨 miniPaint React
          </h1>
          
          {/* 工具按钮 */}
          <div className="flex gap-2">
            <button 
              onClick={activateBrush}
              className={isBrushActive ? 'tool-btn-active' : 'tool-btn'}
              title="画笔工具"
            >
              🖌️
            </button>
            <button 
              onClick={activateRect}
              className={isRectActive ? 'tool-btn-active' : 'tool-btn'}
              title="矩形工具"
            >
              ⬛
            </button>
          </div>

          {/* 历史记录控制 */}
          <div className="flex gap-2 ml-4">
            <button 
              onClick={undo}
              disabled={!canUndo}
              className={canUndo ? 'btn-ghost' : 'btn-ghost opacity-50 cursor-not-allowed'}
              title="撤销"
            >
              ↶
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo}
              className={canRedo ? 'btn-ghost' : 'btn-ghost opacity-50 cursor-not-allowed'}
              title="重做"
            >
              ↷
            </button>
            <button 
              onClick={handleSaveState}
              className="btn-ghost"
              title="保存状态"
            >
              💾
            </button>
          </div>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2">
          <button onClick={clearCanvas} className="btn-ghost" title="清空画布">
            🗑️
          </button>
          <button onClick={handleExport} className="btn" title="导出PNG">
            📥 导出
          </button>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn-ghost"
            title="切换主题"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">工具信息</h3>
            </div>
            <div className="panel-content">
              <p className="text-sm text-gray-600 mb-2">
                当前工具: <span className="font-medium">{activeTool.isActive ? '激活' : '未知'}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                画布尺寸: {width} × {height}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                主题: {theme}
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  🎉 基础设施层重构完成！
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  - Zustand 状态管理 ✅<br/>
                  - React Hooks 架构 ✅<br/>
                  - Fabric.js 集成 ✅<br/>
                  - 历史记录系统 ✅
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* 画布区域 */}
        <div className="canvas-container" ref={canvasContainerRef}>
          <div className="flex-center h-full">
            <div className="relative border-2 border-gray-300 bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="block"
              />
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <aside className="w-64 bg-white border-l border-gray-200 p-4">
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">使用说明</h3>
            </div>
            <div className="panel-content">
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 点击画笔工具，在画布上绘制</p>
                <p>• 点击矩形工具，在画布上绘制矩形</p>
                <p>• 使用撤销/重做按钮操作历史</p>
                <p>• 点击导出按钮下载PNG图片</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App