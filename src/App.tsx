import React from 'react'
import MenuBar from '@/components/MenuBar'
import ToolPanel from '@/components/panels/ToolPanel'
import RightMenuPanel from '@/components/panels/RightMenuPanel'
import ToolSettingsPanel from '@/components/panels/ToolSettingsPanel'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import CanvasArea from '@/components/canvas/CanvasArea'
import AITestPanel from '@/components/AITestPanel'
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

        {/* 中间区域：工具设置面板 + 画布区域 + 竖型菜单 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 工具设置面板 - 横向布局 */}
          <div className="flex-shrink-0 border-b border-gray-200">
            <ToolSettingsPanel />
          </div>

          {/* 画布区域 + 竖型菜单 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 中央画布区域 */}
            <div className="flex-1 h-full">
              <CanvasArea />
            </div>

            {/* 竖型菜单 */}
            <RightMenuPanel />
          </div>
        </div>

        {/* AI面板 - 独立面板 */}
        {panelVisibility.ai && (
          <div className="flex-shrink-0 flex flex-col bg-gray-100 border-l border-gray-300" style={{ width: getPanelWidth() }}>
            {/* AI面板标题栏 */}
            <div className="bg-gray-200 border-b border-gray-300 flex">
              <div className="px-3 py-2 text-sm bg-white text-gray-900 border-b-2 border-blue-500 flex-1">
                🤖 AI助手
              </div>
              <button
                onClick={() => togglePanel('ai')}
                className="px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 border-l border-gray-300"
                title="关闭AI面板"
              >
                ×
              </button>
            </div>

            {/* AI面板内容区域 */}
            <div className="flex-1 bg-white overflow-hidden">
              <AITestPanel />
            </div>
          </div>
        )}
      </div>

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App