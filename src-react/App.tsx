import React from 'react'
import MenuBar from '@/components/MenuBar'
import ToolPanel from '@/components/panels/ToolPanel'
import LayerPanel from '@/components/panels/LayerPanel'
import PropertyPanel from '@/components/panels/PropertyPanel'
import ColorPanel from '@/components/panels/ColorPanel'
import EffectPanel from '@/components/panels/EffectPanel'
import ToolSettingsPanel from '@/components/panels/ToolSettingsPanel'
import EffectTestPanel from '@/components/EffectTestPanel'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import CanvasArea from '@/components/canvas/CanvasArea'
import { useUIStore } from '@/stores/ui'

const App: React.FC = () => {
  const { panelVisibility } = useUIStore()

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
        <CanvasArea />

        {/* 右侧面板区域 */}
        <div className="flex-shrink-0 flex">
          {/* 工具设置面板 */}
          <ToolSettingsPanel />
          
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
          
          {/* 效果面板 */}
          {panelVisibility.effects && (
            <EffectPanel />
          )}
          
          {/* 效果测试面板 (临时) */}
          <EffectTestPanel />
        </div>
      </div>

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App