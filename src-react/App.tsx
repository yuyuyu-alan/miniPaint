import React from 'react'
import MenuBar from '@/components/MenuBar'
import ToolPanel from '@/components/panels/ToolPanel'
import LayerPanel from '@/components/panels/LayerPanel'
import PropertyPanel from '@/components/panels/PropertyPanel'
import ColorPanel from '@/components/panels/ColorPanel'
import EffectPanel from '@/components/panels/EffectPanel'
import ToolSettingsPanel from '@/components/panels/ToolSettingsPanel'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import CanvasArea from '@/components/canvas/CanvasArea'
import { useUIStore } from '@/stores/ui'
import { useResponsive } from '@/hooks/useResponsive'

const App: React.FC = () => {
  const { panelVisibility, togglePanel } = useUIStore()
  const {
    isMobile,
    // isTablet,
    isDesktop,
    shouldShowPanel,
    getPanelWidth,
    getToolPanelWidth,
    // responsive
  } = useResponsive()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部菜单栏 */}
      <MenuBar />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具面板 */}
        {(panelVisibility.tools || shouldShowPanel('tools')) && (
          <div
            className="flex-shrink-0"
            style={{ width: getToolPanelWidth() }}
          >
            <ToolPanel />
          </div>
        )}

        {/* 中央画布区域 */}
        <CanvasArea />

        {/* 右侧面板区域 - Photoshop风格标签式面板 */}
        <div className="flex-shrink-0 flex">
          {/* 工具设置面板 */}
          <div style={{ width: getPanelWidth() }}>
            <ToolSettingsPanel />
          </div>

          {/* 主面板区域 - 标签式 */}
          <div className="flex-shrink-0 flex flex-col bg-gray-100 border-l border-gray-300" style={{ width: getPanelWidth() }}>
            {/* 面板标签栏 */}
            <div className="bg-gray-200 border-b border-gray-300 flex">
              <button
                onClick={() => togglePanel('layers')}
                className={`px-3 py-2 text-sm border-r border-gray-300 transition-colors ${
                  panelVisibility.layers
                    ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                图层
              </button>
              <button
                onClick={() => togglePanel('colors')}
                className={`px-3 py-2 text-sm border-r border-gray-300 transition-colors ${
                  panelVisibility.colors
                    ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                颜色
              </button>
              <button
                onClick={() => togglePanel('properties')}
                className={`px-3 py-2 text-sm border-r border-gray-300 transition-colors ${
                  panelVisibility.properties
                    ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                属性
              </button>
              <button
                onClick={() => togglePanel('effects')}
                className={`px-3 py-2 text-sm transition-colors ${
                  panelVisibility.effects
                    ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                效果
              </button>
            </div>

            {/* 面板内容区域 */}
            <div className="flex-1 bg-white overflow-hidden">
              {/* 图层面板 */}
              {panelVisibility.layers && (
                <div className="h-full">
                  <LayerPanel />
                </div>
              )}
              
              {/* 颜色面板 */}
              {panelVisibility.colors && (
                <div className="h-full">
                  <ColorPanel />
                </div>
              )}
              
              {/* 属性面板 */}
              {panelVisibility.properties && (
                <div className="h-full">
                  <PropertyPanel />
                </div>
              )}
              
              {/* 效果面板 */}
              {panelVisibility.effects && (
                <div className="h-full">
                  <EffectPanel />
                </div>
              )}

              {/* 默认显示图层面板 */}
              {!panelVisibility.layers && !panelVisibility.colors && !panelVisibility.properties && !panelVisibility.effects && (
                <div className="h-full">
                  <LayerPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App