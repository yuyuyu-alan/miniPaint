import React from 'react'
import { useTools, getToolIcon, getToolName } from '@/hooks/useTools'
import { Button, Tooltip } from '@/components/ui'
import type { ToolType } from '@/types'

const tools: ToolType[] = [
  'select', 'brush', 'rectangle', 'circle', 'text', 'line',
  'crop', 'fill', 'erase', 'clone', 'pick_color', 'pen'
]

// 快捷键映射显示
const shortcutKeys: Record<ToolType, string> = {
  select: 'V', brush: 'B', rectangle: 'R', circle: 'C',
  text: 'T', line: 'L', crop: 'K',
  fill: 'G', erase: 'E', clone: 'S', pick_color: 'I', pen: 'P'
}

const ToolPanel: React.FC = () => {
  const { activeTool, activateTool } = useTools()
  
  const handleToolSelect = (toolType: ToolType) => {
    activateTool(toolType)
  }
  
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
      {/* 工具按钮网格 */}
      <div className="p-2 space-y-1">
        {tools.map((toolType) => {
          const iconName = getToolIcon(toolType)
          const toolName = getToolName(toolType)
          const shortcut = shortcutKeys[toolType]
          
          return (
            <Tooltip
              key={toolType}
              content={`${toolName} (快捷键: ${shortcut})`}
              position="right"
            >
              <button
                onClick={() => handleToolSelect(toolType)}
                className={`
                  w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all group
                  ${activeTool === toolType
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-sm'
                    : 'hover:bg-gray-100 text-gray-600 border-2 border-transparent'
                  }
                `}
              >
                {/* 使用 Lucide 图标或 emoji 回退 */}
                <div className="text-lg flex items-center justify-center">
                  <i className={`lucide-${iconName}`} style={{ fontSize: '16px' }} />
                </div>
                <span className="text-xs mt-0.5 opacity-60 group-hover:opacity-80">
                  {toolName}
                </span>
              </button>
            </Tooltip>
          )
        })}
      </div>
      
      {/* 分割线 */}
      <div className="mx-2 border-t border-gray-200 my-2" />
      
      {/* 工具设置按钮 */}
      <div className="p-2">
        <Tooltip content="工具设置" position="right">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <i className="lucide-settings" style={{ fontSize: '16px' }} />
          </button>
        </Tooltip>
      </div>
      
      {/* 当前工具信息 */}
      <div className="mt-auto p-2">
        <div className="text-xs text-center text-gray-500">
          <div className="font-medium">{getToolName(activeTool)}</div>
          <div className="opacity-70">({shortcutKeys[activeTool]})</div>
        </div>
      </div>
    </div>
  )
}

export default ToolPanel