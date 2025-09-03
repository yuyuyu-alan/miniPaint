import React, { useState } from 'react'
import { useUIStore } from '@/stores/ui'

const ColorPanel: React.FC = () => {
  const { colors, setPrimaryColor, setSecondaryColor, addToSwatches, removeFromSwatches } = useUIStore()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleColorChange = (color: string, isPrimary: boolean = true) => {
    if (isPrimary) {
      setPrimaryColor(color)
    } else {
      setSecondaryColor(color)
    }
  }

  const handleAddToSwatches = (color: string) => {
    addToSwatches(color)
  }

  const predefinedColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080', '#c0c0c0',
    '#ff8080', '#80ff80', '#8080ff', '#ffff80', '#ff80ff', '#80ffff', '#ffc080', '#80c0ff',
  ]

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* 头部 */}
      <div className="panel-header">
        <h3 className="font-medium text-gray-900">颜色</h3>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {/* 主要颜色 */}
        <div className="space-y-3">
          {/* 前景色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">前景色</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={colors.primary}
                  onChange={(e) => handleColorChange(e.target.value, true)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                  title="选择前景色"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.primary.toUpperCase()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      handleColorChange(value, true)
                    }
                  }}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* 背景色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => handleColorChange(e.target.value, false)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                  title="选择背景色"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.secondary.toUpperCase()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      handleColorChange(value, false)
                    }
                  }}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* 颜色交换按钮 */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const temp = colors.primary
                setPrimaryColor(colors.secondary)
                setSecondaryColor(temp)
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="交换前景色和背景色"
            >
              ⇄
            </button>
          </div>
        </div>

        {/* 预定义颜色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">预设颜色</label>
          <div className="grid grid-cols-8 gap-1">
            {predefinedColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color, true)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleColorChange(color, false)
                }}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={`${color} (右键设为背景色)`}
              />
            ))}
          </div>
        </div>

        {/* 用户调色板 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">我的调色板</label>
            <button
              onClick={() => handleAddToSwatches(colors.primary)}
              className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50"
              title="添加当前前景色到调色板"
            >
              + 添加
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 min-h-12">
            {colors.swatches.slice(0, 24).map((color, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => handleColorChange(color, true)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleColorChange(color, false)
                  }}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={`${color} (右键设为背景色)`}
                />
                <button
                  onClick={() => removeFromSwatches(color)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="删除此颜色"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 最近使用的颜色 */}
        {colors.recentColors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最近使用</label>
            <div className="flex flex-wrap gap-1">
              {colors.recentColors.slice(0, 10).map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorChange(color, true)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleColorChange(color, false)
                  }}
                  className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={`${color} (右键设为背景色)`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 颜色信息 */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>调色板:</span>
            <span>{colors.swatches.length}/24</span>
          </div>
          <div className="flex justify-between">
            <span>最近使用:</span>
            <span>{colors.recentColors.length}/10</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorPanel