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
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">大小:</label>
        <input
          type="range"
          min="1"
          max="100"
          value={currentSettings.brushSize || 5}
          onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.brushSize || 5}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">颜色:</label>
        <input
          type="color"
          value={currentSettings.brushColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('brushColor', e.target.value)
            setPrimaryColor(e.target.value)
          }}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.brushColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('brushColor', e)
            setPrimaryColor(e)
          }}
          className="w-16 text-xs"
          size="sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">透明度:</label>
        <input
          type="range"
          min="1"
          max="100"
          value={currentSettings.brushOpacity || 100}
          onChange={(e) => handleSettingChange('brushOpacity', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-8">
          {currentSettings.brushOpacity || 100}%
        </span>
      </div>
    </>
  )

  const renderShapeSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">描边:</label>
        <input
          type="color"
          value={currentSettings.strokeColor || '#000000'}
          onChange={(e) => handleSettingChange('strokeColor', e.target.value)}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.strokeColor || '#000000'}
          onChange={(e) => handleSettingChange('strokeColor', e)}
          className="w-16 text-xs"
          size="sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">填充:</label>
        <input
          type="color"
          value={currentSettings.fillColor === 'transparent' ? '#ffffff' : currentSettings.fillColor || '#ffffff'}
          onChange={(e) => handleSettingChange('fillColor', e.target.value)}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.fillColor || 'transparent'}
          onChange={(e) => handleSettingChange('fillColor', e)}
          className="w-16 text-xs"
          size="sm"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleSettingChange('fillColor', 'transparent')}
          title="透明填充"
          className="px-1 text-xs"
        >
          ∅
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">宽度:</label>
        <input
          type="range"
          min="0"
          max="20"
          value={currentSettings.strokeWidth || 2}
          onChange={(e) => handleSettingChange('strokeWidth', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.strokeWidth || 2}
        </span>
      </div>
    </>
  )

  const renderTextSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">大小:</label>
        <input
          type="range"
          min="8"
          max="72"
          value={currentSettings.fontSize || 16}
          onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.fontSize || 16}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">字体:</label>
        <select
          value={currentSettings.fontFamily || 'Arial'}
          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier</option>
        </select>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant={currentSettings.fontWeight === 'bold' ? 'primary' : 'ghost'}
          onClick={() => handleSettingChange('fontWeight',
            currentSettings.fontWeight === 'bold' ? 'normal' : 'bold'
          )}
          className="px-2 text-xs"
        >
          B
        </Button>
        <Button
          size="sm"
          variant={currentSettings.fontStyle === 'italic' ? 'primary' : 'ghost'}
          onClick={() => handleSettingChange('fontStyle',
            currentSettings.fontStyle === 'italic' ? 'normal' : 'italic'
          )}
          className="px-2 text-xs"
        >
          I
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">颜色:</label>
        <input
          type="color"
          value={currentSettings.fillColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('fillColor', e.target.value)
            setPrimaryColor(e.target.value)
          }}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.fillColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('fillColor', e)
            setPrimaryColor(e)
          }}
          className="w-16 text-xs"
          size="sm"
        />
      </div>
    </>
  )

  const renderEraseSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">大小:</label>
        <input
          type="range"
          min="5"
          max="100"
          value={currentSettings.brushSize || 20}
          onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.brushSize || 20}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">强度:</label>
        <input
          type="range"
          min="10"
          max="100"
          value={currentSettings.opacity || 100}
          onChange={(e) => handleSettingChange('opacity', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-8">
          {currentSettings.opacity || 100}%
        </span>
      </div>
    </>
  )

  const renderFillSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">颜色:</label>
        <input
          type="color"
          value={currentSettings.fillColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('fillColor', e.target.value)
            setPrimaryColor(e.target.value)
          }}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.fillColor || colors.primary}
          onChange={(e) => {
            handleSettingChange('fillColor', e)
            setPrimaryColor(e)
          }}
          className="w-16 text-xs"
          size="sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">容差:</label>
        <input
          type="range"
          min="0"
          max="50"
          value={currentSettings.tolerance || 10}
          onChange={(e) => handleSettingChange('tolerance', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.tolerance || 10}
        </span>
      </div>
    </>
  )

  const renderCloneSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">大小:</label>
        <input
          type="range"
          min="5"
          max="100"
          value={currentSettings.brushSize || 20}
          onChange={(e) => handleSettingChange('brushSize', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.brushSize || 20}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">透明度:</label>
        <input
          type="range"
          min="10"
          max="100"
          value={currentSettings.opacity || 100}
          onChange={(e) => handleSettingChange('opacity', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-8">
          {currentSettings.opacity || 100}%
        </span>
      </div>
    </>
  )

  const renderPenSettings = () => (
    <>
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">描边:</label>
        <input
          type="color"
          value={currentSettings.strokeColor || '#000000'}
          onChange={(e) => handleSettingChange('strokeColor', e.target.value)}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.strokeColor || '#000000'}
          onChange={(e) => handleSettingChange('strokeColor', e)}
          className="w-16 text-xs"
          size="sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">填充:</label>
        <input
          type="color"
          value={currentSettings.fillColor === 'transparent' ? '#ffffff' : currentSettings.fillColor || '#ffffff'}
          onChange={(e) => handleSettingChange('fillColor', e.target.value)}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <Input
          type="text"
          value={currentSettings.fillColor || 'transparent'}
          onChange={(e) => handleSettingChange('fillColor', e)}
          className="w-16 text-xs"
          size="sm"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleSettingChange('fillColor', 'transparent')}
          title="透明填充"
          className="px-1 text-xs"
        >
          ∅
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">宽度:</label>
        <input
          type="range"
          min="1"
          max="10"
          value={currentSettings.strokeWidth || 2}
          onChange={(e) => handleSettingChange('strokeWidth', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">
          {currentSettings.strokeWidth || 2}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">平滑:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={currentSettings.smoothing || 0.5}
          onChange={(e) => handleSettingChange('smoothing', parseFloat(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-8">
          {(currentSettings.smoothing || 0.5).toFixed(1)}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={currentSettings.showControlPoints !== false}
            onChange={(e) => handleSettingChange('showControlPoints', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-xs text-gray-700 whitespace-nowrap">控制点</span>
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={currentSettings.snapToGrid || false}
            onChange={(e) => handleSettingChange('snapToGrid', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-xs text-gray-700 whitespace-nowrap">网格</span>
        </label>
      </div>
    </>
  )

  const renderToolSettings = () => {
    switch (activeTool) {
      case 'brush':
        return renderBrushSettings()
      case 'rectangle':
      case 'circle':
      case 'line':
        return renderShapeSettings()
      case 'text':
        return renderTextSettings()
      case 'erase':
        return renderEraseSettings()
      case 'fill':
        return renderFillSettings()
      case 'clone':
        return renderCloneSettings()
      case 'pen':
        return renderPenSettings()
      default:
        return (
          <div className="text-center text-gray-500 py-1">
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
      crop: '裁剪工具',
      fill: '填充工具',
      erase: '橡皮擦工具',
      clone: '仿制工具',
      pick_color: '吸色器工具',
      pen: '钢笔工具',
    }
    return names[tool] || tool
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-2 flex items-center space-x-6 overflow-x-auto">
        {/* 工具名称 */}
        <div className="flex-shrink-0">
          <span className="text-sm font-medium text-gray-900">
            {getToolDisplayName(activeTool)}
          </span>
        </div>

        {/* 设置内容 - 横向布局 */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {renderToolSettings()}
        </div>

        {/* 快速操作 */}
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // 重置当前工具设置
              const { resetToolSettings } = useToolStore.getState()
              resetToolSettings(activeTool)
            }}
            className="text-xs"
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ToolSettingsPanel