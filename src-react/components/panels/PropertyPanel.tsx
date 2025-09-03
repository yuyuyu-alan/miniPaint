import React from 'react'
import { useToolStore } from '@/stores/tools'
import { useLayerStore } from '@/stores/layers'
import { useUIStore } from '@/stores/ui'
import { Input, Button, Dropdown } from '@/components/ui'
import type { DropdownOption } from '@/components/ui'

const PropertyPanel: React.FC = () => {
  const { activeTool, toolSettings, updateToolSettings } = useToolStore()
  const { getActiveLayer } = useLayerStore()
  const { colors } = useUIStore()
  
  const activeLayer = getActiveLayer()
  const currentSettings = toolSettings[activeTool] || {}

  // 字体选项
  const fontOptions: DropdownOption[] = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
  ]

  // 文本对齐选项
  const alignOptions: DropdownOption[] = [
    { value: 'left', label: '左对齐', icon: '📄' },
    { value: 'center', label: '居中', icon: '📄' },
    { value: 'right', label: '右对齐', icon: '📄' },
    { value: 'justify', label: '两端对齐', icon: '📄' },
  ]

  // 混合模式选项
  const blendModeOptions: DropdownOption[] = [
    { value: 'normal', label: '正常' },
    { value: 'multiply', label: '正片叠底' },
    { value: 'screen', label: '滤色' },
    { value: 'overlay', label: '叠加' },
    { value: 'soft-light', label: '柔光' },
    { value: 'hard-light', label: '强光' },
  ]

  const renderToolProperties = () => {
    switch (activeTool) {
      case 'brush':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">画笔大小</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={currentSettings.brushSize || 5}
                  onChange={(e) => updateToolSettings(activeTool, { brushSize: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.brushSize || 5}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">不透明度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentSettings.brushOpacity || 100}
                  onChange={(e) => updateToolSettings(activeTool, { brushOpacity: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-10">{currentSettings.brushOpacity || 100}%</span>
              </div>
            </div>
          </div>
        )

      case 'rectangle':
      case 'circle':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描边宽度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={currentSettings.strokeWidth || 2}
                  onChange={(e) => updateToolSettings(activeTool, { strokeWidth: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.strokeWidth || 2}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描边</label>
                <input
                  type="color"
                  value={currentSettings.strokeColor || colors.primary}
                  onChange={(e) => updateToolSettings(activeTool, { strokeColor: e.target.value })}
                  className="w-full h-8 rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">填充</label>
                <input
                  type="color"
                  value={currentSettings.fillColor || 'transparent'}
                  onChange={(e) => updateToolSettings(activeTool, { fillColor: e.target.value })}
                  className="w-full h-8 rounded border"
                />
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">字体</label>
              <Dropdown
                options={fontOptions}
                value={currentSettings.fontFamily || 'Arial'}
                onChange={(value) => updateToolSettings(activeTool, { fontFamily: value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">字号</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={currentSettings.fontSize || 16}
                  onChange={(e) => updateToolSettings(activeTool, { fontSize: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.fontSize || 16}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">对齐方式</label>
              <Dropdown
                options={alignOptions}
                value={currentSettings.textAlign || 'left'}
                onChange={(value) => updateToolSettings(activeTool, { textAlign: value })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={currentSettings.fontWeight === 'bold'}
                  onChange={(e) => updateToolSettings(activeTool, { fontWeight: e.target.checked ? 'bold' : 'normal' })}
                />
                粗体
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={currentSettings.fontStyle === 'italic'}
                  onChange={(e) => updateToolSettings(activeTool, { fontStyle: e.target.checked ? 'italic' : 'normal' })}
                />
                斜体
              </label>
            </div>
          </div>
        )

      case 'erase':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">橡皮大小</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={currentSettings.brushSize || 20}
                  onChange={(e) => updateToolSettings(activeTool, { brushSize: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.brushSize || 20}</span>
              </div>
            </div>
          </div>
        )

      case 'line':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">线条宽度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentSettings.strokeWidth || 2}
                  onChange={(e) => updateToolSettings(activeTool, { strokeWidth: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.strokeWidth || 2}</span>
              </div>
            </div>
            
          </div>
        )

      case 'pen':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描边宽度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentSettings.strokeWidth || 2}
                  onChange={(e) => updateToolSettings(activeTool, { strokeWidth: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{currentSettings.strokeWidth || 2}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">平滑度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentSettings.smoothing || 0.5}
                  onChange={(e) => updateToolSettings(activeTool, { smoothing: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">{((currentSettings.smoothing || 0.5) * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描边</label>
                <input
                  type="color"
                  value={currentSettings.strokeColor || colors.primary}
                  onChange={(e) => updateToolSettings(activeTool, { strokeColor: e.target.value })}
                  className="w-full h-8 rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">填充</label>
                <input
                  type="color"
                  value={currentSettings.fillColor || 'transparent'}
                  onChange={(e) => updateToolSettings(activeTool, { fillColor: e.target.value })}
                  className="w-full h-8 rounded border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={currentSettings.showControlPoints !== false}
                  onChange={(e) => updateToolSettings(activeTool, { showControlPoints: e.target.checked })}
                />
                显示控制点
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={currentSettings.snapToGrid || false}
                  onChange={(e) => updateToolSettings(activeTool, { snapToGrid: e.target.checked })}
                />
                对齐网格
              </label>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">选择工具以查看属性</p>
          </div>
        )
    }
  }

  const renderLayerProperties = () => {
    if (!activeLayer) {
      return (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">没有选中的图层</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <Input
            label="图层名称"
            value={activeLayer.name}
            onChange={(value) => {
              // 这里需要更新图层名称的逻辑
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">不透明度</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={activeLayer.opacity}
              onChange={(e) => {
                // 这里需要更新图层不透明度的逻辑
              }}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10">{activeLayer.opacity}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">混合模式</label>
          <Dropdown
            options={blendModeOptions}
            value={activeLayer.blendMode || 'normal'}
            onChange={(value) => {
              // 这里需要更新混合模式的逻辑
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeLayer.visible}
              onChange={(e) => {
                // 这里需要切换可见性的逻辑
              }}
            />
            可见
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeLayer.locked}
              onChange={(e) => {
                // 这里需要切换锁定状态的逻辑
              }}
            />
            锁定
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="panel-header">
        <h3 className="font-medium text-gray-900">属性</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 工具属性 */}
        <div className="border-b border-gray-200">
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {activeTool === 'select' ? '选择工具' :
               activeTool === 'brush' ? '画笔工具' :
               activeTool === 'rectangle' ? '矩形工具' :
               activeTool === 'circle' ? '圆形工具' :
               activeTool === 'text' ? '文本工具' :
               activeTool === 'line' ? '直线工具' :
               activeTool === 'erase' ? '橡皮工具' :
               activeTool === 'pen' ? '钢笔工具' :
               activeTool}属性
            </h4>
            {renderToolProperties()}
          </div>
        </div>

        {/* 图层属性 */}
        <div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">图层属性</h4>
            {renderLayerProperties()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyPanel