import React, { useState } from 'react'
import { useLayerStore } from '@/stores/layers'
import { Button, Input } from '@/components/ui'

const LayerPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    updateLayer,
    setActiveLayer,
    toggleLayerVisibility,
    moveLayerUp,
    moveLayerDown,
    duplicateLayer,
  } = useLayerStore()

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddLayer = () => {
    const newLayerId = addLayer({
      name: `图层 ${layers.length + 1}`,
      visible: true,
      opacity: 100,
      locked: false,
      type: 'raster',
    })
    setActiveLayer(newLayerId)
  }

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length > 1) {
      removeLayer(layerId)
    }
  }

  const handleDuplicateLayer = (layerId: string) => {
    duplicateLayer(layerId)
  }

  const handleStartEdit = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId)
    setEditingName(currentName)
  }

  const handleFinishEdit = () => {
    if (editingLayerId && editingName.trim()) {
      updateLayer(editingLayerId, { name: editingName.trim() })
    }
    setEditingLayerId(null)
    setEditingName('')
  }

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit()
    } else if (e.key === 'Escape') {
      setEditingLayerId(null)
      setEditingName('')
    }
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="panel-header">
        <h3 className="font-medium text-gray-900">图层</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddLayer}
            className="p-1"
            title="添加图层"
          >
            ➕
          </Button>
        </div>
      </div>

      {/* 图层列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`
                group p-3 rounded-lg cursor-pointer transition-all border-2
                ${layer.id === activeLayerId
                  ? 'bg-primary-50 border-primary-200 shadow-sm'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }
              `}
              onClick={() => setActiveLayer(layer.id)}
            >
              {/* 图层信息行 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* 可见性切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLayerVisibility(layer.id)
                    }}
                    className="text-sm hover:bg-white rounded p-1"
                    title={layer.visible ? '隐藏图层' : '显示图层'}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>

                  {/* 图层名称 */}
                  <div className="flex-1 min-w-0">
                    {editingLayerId === layer.id ? (
                      <Input
                        value={editingName}
                        onChange={setEditingName}
                        onBlur={handleFinishEdit}
                        onKeyDown={handleKeyPress}
                        className="text-sm"
                        size="sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm font-medium text-gray-900 truncate block"
                        onDoubleClick={() => handleStartEdit(layer.id, layer.name)}
                        title={layer.name}
                      >
                        {layer.name}
                      </span>
                    )}
                  </div>

                  {/* 锁定状态 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateLayer(layer.id, { locked: !layer.locked })
                    }}
                    className="text-xs hover:bg-white rounded p-1"
                    title={layer.locked ? '解锁图层' : '锁定图层'}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              </div>

              {/* 图层属性行 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="bg-gray-200 px-2 py-1 rounded-full">
                  {layer.type}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* 不透明度 */}
                  <div className="flex items-center gap-1">
                    <span>透明度:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => handleOpacityChange(layer.id, parseInt(e.target.value))}
                      className="w-12 h-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="w-8 text-right">{layer.opacity}%</span>
                  </div>
                </div>
              </div>

              {/* 图层操作按钮 (hover 显示) */}
              <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveLayerUp(layer.id)
                    }}
                    disabled={index === 0}
                    className="text-xs px-2 py-1 rounded hover:bg-white disabled:opacity-50"
                    title="上移图层"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveLayerDown(layer.id)
                    }}
                    disabled={index === layers.length - 1}
                    className="text-xs px-2 py-1 rounded hover:bg-white disabled:opacity-50"
                    title="下移图层"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicateLayer(layer.id)
                    }}
                    className="text-xs px-2 py-1 rounded hover:bg-white"
                    title="复制图层"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLayer(layer.id)
                    }}
                    disabled={layers.length <= 1}
                    className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
                    title="删除图层"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>图层总数:</span>
            <span>{layers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>当前图层:</span>
            <span className="truncate max-w-20" title={layers.find(l => l.id === activeLayerId)?.name}>
              {layers.find(l => l.id === activeLayerId)?.name || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerPanel