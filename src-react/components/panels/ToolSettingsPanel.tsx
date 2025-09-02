import React, { useState } from 'react'
import { useTools } from '@/hooks/useTools'
import { useToolStore } from '@/stores/tools'
import { useUIStore } from '@/stores/ui'
import { Button, Input } from '@/components/ui'
import type { ToolType, ToolSettings } from '@/types'

const ToolSettingsPanel: React.FC = () => {
  const { activeTool, getActiveToolSettings, updateToolSettings } = useToolStore()
  const { colors, setPrimaryColor, setSecondaryColor } = useUIStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const currentSettings = getActiveToolSettings()

  const handleSettingChange = (key: string, value: any) => {
    updateToolSettings(activeTool, { [key]: value })
  }

  const renderBrushSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          画笔大小
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="1"
            max="100"
            value={currentSettings.brushSize || 5}
            onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.brushSize || 5}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          画笔颜色
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentSettings.brushColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('brushColor', e.target.value)
              setPrimaryColor(e.target.value)
            }}
            className="w-8 h-8 rounded border border-gray-300"
          />
          <Input
            type="text"
            value={currentSettings.brushColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('brushColor', e)
              setPrimaryColor(e)
            }}
            className="flex-1 text-sm"
            size="sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          不透明度
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="1"
            max="100"
            value={currentSettings.brushOpacity || 100}
            onChange={(e) => handleSettingChange('brushOpacity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.brushOpacity || 100}%
          </span>
        </div>
      </div>
    </div>
  )

  const renderShapeSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描边颜色
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentSettings.strokeColor || '#000000'}
            onChange={(e) => handleSettingChange('strokeColor', e.target.value)}
            className="w-8 h-8 rounded border border-gray-300"
          />
          <Input
            type="text"
            value={currentSettings.strokeColor || '#000000'}
            onChange={(e) => handleSettingChange('strokeColor', e)}
            className="flex-1 text-sm"
            size="sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          填充颜色
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentSettings.fillColor === 'transparent' ? '#ffffff' : currentSettings.fillColor || '#ffffff'}
            onChange={(e) => handleSettingChange('fillColor', e.target.value)}
            className="w-8 h-8 rounded border border-gray-300"
          />
          <Input
            type="text"
            value={currentSettings.fillColor || 'transparent'}
            onChange={(e) => handleSettingChange('fillColor', e)}
            className="flex-1 text-sm"
            size="sm"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSettingChange('fillColor', 'transparent')}
            title="透明填充"
          >
            ∅
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描边宽度
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="20"
            value={currentSettings.strokeWidth || 2}
            onChange={(e) => handleSettingChange('strokeWidth', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.strokeWidth || 2}
          </span>
        </div>
      </div>
    </div>
  )

  const renderTextSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          字体大小
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="8"
            max="72"
            value={currentSettings.fontSize || 16}
            onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.fontSize || 16}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          字体
        </label>
        <select
          value={currentSettings.fontFamily || 'Arial'}
          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          字体样式
        </label>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={currentSettings.fontWeight === 'bold' ? 'primary' : 'ghost'}
            onClick={() => handleSettingChange('fontWeight', 
              currentSettings.fontWeight === 'bold' ? 'normal' : 'bold'
            )}
            className="px-2"
          >
            B
          </Button>
          <Button
            size="sm"
            variant={currentSettings.fontStyle === 'italic' ? 'primary' : 'ghost'}
            onClick={() => handleSettingChange('fontStyle', 
              currentSettings.fontStyle === 'italic' ? 'normal' : 'italic'
            )}
            className="px-2"
          >
            I
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          文本颜色
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentSettings.fillColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('fillColor', e.target.value)
              setPrimaryColor(e.target.value)
            }}
            className="w-8 h-8 rounded border border-gray-300"
          />
          <Input
            type="text"
            value={currentSettings.fillColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('fillColor', e)
              setPrimaryColor(e)
            }}
            className="flex-1 text-sm"
            size="sm"
          />
        </div>
      </div>
    </div>
  )

  const renderEraseSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          橡皮擦大小
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max="100"
            value={currentSettings.brushSize || 20}
            onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.brushSize || 20}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          擦除强度
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="100"
            value={currentSettings.opacity || 100}
            onChange={(e) => handleSettingChange('opacity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.opacity || 100}%
          </span>
        </div>
      </div>
    </div>
  )

  const renderFillSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          填充颜色
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentSettings.fillColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('fillColor', e.target.value)
              setPrimaryColor(e.target.value)
            }}
            className="w-8 h-8 rounded border border-gray-300"
          />
          <Input
            type="text"
            value={currentSettings.fillColor || colors.primary}
            onChange={(e) => {
              handleSettingChange('fillColor', e)
              setPrimaryColor(e)
            }}
            className="flex-1 text-sm"
            size="sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          容差
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="50"
            value={currentSettings.tolerance || 10}
            onChange={(e) => handleSettingChange('tolerance', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.tolerance || 10}
          </span>
        </div>
      </div>
    </div>
  )

  const renderCloneSettings = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          克隆笔刷大小
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max="100"
            value={currentSettings.brushSize || 20}
            onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.brushSize || 20}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          不透明度
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="100"
            value={currentSettings.opacity || 100}
            onChange={(e) => handleSettingChange('opacity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentSettings.opacity || 100}%
          </span>
        </div>
      </div>
    </div>
  )

  const renderToolSettings = () => {
    switch (activeTool) {
      case 'brush':
        return renderBrushSettings()
      case 'rectangle':
      case 'circle':
      case 'line':
      case 'arrow':
        return renderShapeSettings()
      case 'text':
        return renderTextSettings()
      case 'erase':
        return renderEraseSettings()
      case 'fill':
        return renderFillSettings()
      case 'clone':
        return renderCloneSettings()
      default:
        return (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">当前工具无可配置选项</p>
          </div>
        )
    }
  }

  const getToolDisplayName = (tool: ToolType): string => {
    const names: Record<ToolType, string> = {
      select: '选择工具',
      brush: '画笔工具',
      rectangle: '矩形工具',
      circle: '圆形工具',
      text: '文本工具',
      line: '直线工具',
      arrow: '箭头工具',
      crop: '裁剪工具',
      fill: '填充工具',
      erase: '橡皮擦工具',
      clone: '仿制工具',
      pick_color: '吸色器工具',
    }
    return names[tool] || tool
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200">
      {/* 面板头部 */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">工具设置</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {getToolDisplayName(activeTool)}
        </p>
      </div>

      {/* 设置内容 */}
      <div className={`transition-all duration-200 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
        <div className="p-3">
          {renderToolSettings()}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="p-3 border-t border-gray-200">
        <div className="space-y-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // 重置当前工具设置
              const { resetToolSettings } = useToolStore.getState()
              resetToolSettings(activeTool)
            }}
            className="w-full text-left justify-start"
          >
            重置设置
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ToolSettingsPanel