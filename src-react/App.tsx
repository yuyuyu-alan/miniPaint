import React from 'react'
import MenuBar from '@/components/MenuBar'
import ToolPanel from '@/components/panels/ToolPanel'
import LayerPanel from '@/components/panels/LayerPanel'
import PropertyPanel from '@/components/panels/PropertyPanel'
import ColorPanel from '@/components/panels/ColorPanel'
import { useUIStore } from '@/stores/ui'
import { useCanvasStore } from '@/stores/canvas'

const App: React.FC = () => {
  const { panelVisibility } = useUIStore()
  const { width, height, zoom } = useCanvasStore()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部菜单栏 */}
      <MenuBar />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具面板 */}
        {panelVisibility.tools && (
          <div className="flex-shrink-0">
            <ToolPanel />
          </div>
        )}

        {/* 中央画布区域 */}
        <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
          {/* 画布容器 */}
          <div className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
            {/* 画布信息栏 */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>画布: {width} × {height}px</span>
                <span>缩放: {Math.round(zoom * 100)}%</span>
              </div>
            </div>
            
            {/* 画布主体 */}
            <div 
              className="relative bg-white flex items-center justify-center"
              style={{ width: width, height: height }}
            >
              {/* 占位内容 */}
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-sm font-medium">miniPaint Canvas</p>
                <p className="text-xs mt-1 text-gray-500">
                  准备集成 Fabric.js<br/>
                  React 重构版
                </p>
              </div>
            </div>
          </div>

          {/* 画布控制器 */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
              <span className="text-sm text-gray-600">
                Phase 2 完成 - UI 组件系统
              </span>
            </div>
          </div>
        </div>

        {/* 右侧面板区域 */}
        <div className="flex-shrink-0 flex">
          {/* 图层面板 */}
          {panelVisibility.layers && (
            <LayerPanel />
          )}
          
          {/* 属性面板 */}
          {panelVisibility.properties && (
            <PropertyPanel />
          )}
          
          {/* 颜色面板 */}
          {panelVisibility.colors && (
            <ColorPanel />
          )}
        </div>
      </div>
    </div>
  )
}

export default App