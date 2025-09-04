import React, { useState, useRef, useEffect } from 'react'
import { Tooltip } from '@/components/ui'
import LayerPanel from './LayerPanel'

const RightMenuPanel: React.FC = () => {
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const layerButtonRef = useRef<HTMLButtonElement>(null)

  // 点击外部关闭图层面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layerButtonRef.current && !layerButtonRef.current.contains(event.target as Node)) {
        const layerPanel = document.querySelector('.layer-panel-popup')
        if (layerPanel && !layerPanel.contains(event.target as Node)) {
          setShowLayerPanel(false)
        }
      }
    }

    if (showLayerPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLayerPanel])

  return (
    <div className="w-20 bg-white border-l border-gray-200 flex flex-col">
      {/* 图层面板按钮 */}
      <div className="p-2 relative">
        <Tooltip content="图层面板" position="left">
          <button
            ref={layerButtonRef}
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`w-16 h-12 flex flex-col items-center justify-center rounded-lg text-gray-600 relative transition-colors ${
              showLayerPanel ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            {/* 图层图标 */}
            <div className="text-lg mb-1">
              📄
            </div>
            {/* 文字标签 */}
            <span className="text-xs opacity-70">图层</span>
          </button>
        </Tooltip>

        {/* 图层面板气泡弹框 */}
        {showLayerPanel && (
          <div className="layer-panel-popup absolute right-full top-0 mr-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* 箭头 */}
            <div className="absolute right-0 top-4 transform translate-x-1 w-2 h-2 bg-white border-r border-t border-gray-200 rotate-45"></div>
            
            {/* 图层面板内容 */}
            <div className="w-80 max-h-96 overflow-y-auto">
              <LayerPanel />
            </div>
          </div>
        )}
      </div>

      {/* 可以在这里添加更多的菜单项 */}
      {/* 例如：历史记录、书签等 */}
    </div>
  )
}

export default RightMenuPanel