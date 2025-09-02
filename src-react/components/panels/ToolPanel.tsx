import React from 'react'
import { useToolStore } from '@/stores/tools'
import { Button } from '@/components/ui'
import type { ToolType } from '@/types'

interface Tool {
  type: ToolType
  name: string
  icon: string
  shortcut?: string
}

const tools: Tool[] = [
  { type: 'select', name: '选择', icon: '↖️', shortcut: 'V' },
  { type: 'brush', name: '画笔', icon: '🖌️', shortcut: 'B' },
  { type: 'rectangle', name: '矩形', icon: '⬛', shortcut: 'R' },
  { type: 'circle', name: '圆形', icon: '⭕', shortcut: 'C' },
  { type: 'text', name: '文本', icon: '📝', shortcut: 'T' },
  { type: 'line', name: '直线', icon: '📏', shortcut: 'L' },
  { type: 'arrow', name: '箭头', icon: '➡️', shortcut: 'A' },
  { type: 'crop', name: '裁剪', icon: '✂️', shortcut: 'K' },
  { type: 'fill', name: '填充', icon: '🪣', shortcut: 'G' },
  { type: 'erase', name: '橡皮', icon: '🧽', shortcut: 'E' },
  { type: 'clone', name: '克隆', icon: '📋', shortcut: 'S' },
  { type: 'pick_color', name: '拾色', icon: '🎨', shortcut: 'I' },
]

const ToolPanel: React.FC = () => {
  const { activeTool, setActiveTool } = useToolStore()
  
  const handleToolSelect = (toolType: ToolType) => {
    setActiveTool(toolType)
  }
  
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
      {/* 工具按钮网格 */}
      <div className="p-2 space-y-1">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            className={`
              w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all
              ${activeTool === tool.type 
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-600 border-2 border-transparent'
              }
            `}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="text-lg leading-none">{tool.icon}</span>
            {tool.shortcut && (
              <span className="text-xs mt-0.5 opacity-60">{tool.shortcut}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* 分割线 */}
      <div className="mx-2 border-t border-gray-200 my-2" />
      
      {/* 工具设置按钮 */}
      <div className="p-2">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
          title="工具设置"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}

export default ToolPanel