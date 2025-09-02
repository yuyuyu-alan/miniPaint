import React from 'react'
import MenuBar from '@/components/MenuBar'
import ToolPanel from '@/components/panels/ToolPanel'
import LayerPanel from '@/components/panels/LayerPanel'
import PropertyPanel from '@/components/panels/PropertyPanel'
import ColorPanel from '@/components/panels/ColorPanel'
import EffectPanel from '@/components/panels/EffectPanel'
import ToolSettingsPanel from '@/components/panels/ToolSettingsPanel'
import FeatureTestPanel from '@/components/FeatureTestPanel'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import CanvasArea from '@/components/canvas/CanvasArea'
import { useUIStore } from '@/stores/ui'
import { useResponsive } from '@/hooks/useResponsive'

const App: React.FC = () => {
  const { panelVisibility, togglePanel } = useUIStore()
  const {
    isMobile,
    isTablet,
    isDesktop,
    shouldShowPanel,
    getPanelWidth,
    getToolPanelWidth,
    responsive
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

        {/* 右侧面板区域 */}
        <div className={`flex-shrink-0 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
          {/* 移动端面板切换按钮 */}
          {isMobile && (
            <div className="bg-white border-t border-gray-200 p-2 flex justify-around">
              <button
                onClick={() => togglePanel('layers')}
                className={`px-3 py-2 rounded text-sm ${
                  panelVisibility.layers ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                图层
              </button>
              <button
                onClick={() => togglePanel('colors')}
                className={`px-3 py-2 rounded text-sm ${
                  panelVisibility.colors ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                颜色
              </button>
              <button
                onClick={() => togglePanel('effects')}
                className={`px-3 py-2 rounded text-sm ${
                  panelVisibility.effects ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                效果
              </button>
            </div>
          )}

          {/* 工具设置面板 */}
          {!isMobile && (
            <div style={{ width: getPanelWidth() }}>
              <ToolSettingsPanel />
            </div>
          )}
          
          {/* 图层面板 */}
          {(panelVisibility.layers || (isDesktop && shouldShowPanel('layers'))) && (
            <div
              className={isMobile ? 'w-full' : ''}
              style={!isMobile ? { width: getPanelWidth() } : {}}
            >
              <LayerPanel />
            </div>
          )}
          
          {/* 属性面板 */}
          {panelVisibility.properties && isDesktop && (
            <div style={{ width: getPanelWidth() }}>
              <PropertyPanel />
            </div>
          )}
          
          {/* 颜色面板 */}
          {(panelVisibility.colors || (isDesktop && shouldShowPanel('colors'))) && (
            <div
              className={isMobile ? 'w-full' : ''}
              style={!isMobile ? { width: getPanelWidth() } : {}}
            >
              <ColorPanel />
            </div>
          )}
          
          {/* 效果面板 */}
          {(panelVisibility.effects || (isDesktop && shouldShowPanel('effects'))) && (
            <div
              className={isMobile ? 'w-full' : ''}
              style={!isMobile ? { width: getPanelWidth() } : {}}
            >
              <EffectPanel />
            </div>
          )}

          {/* 功能测试面板 (临时) */}
          <FeatureTestPanel />
        </div>
      </div>

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App