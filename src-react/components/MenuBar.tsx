import React, { useState } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'
import { useHistoryStore } from '@/stores/history'
import { useUIStore } from '@/stores/ui'
import { Button, Modal, Input } from '@/components/ui'

interface MenuBarProps {
  className?: string
}

const MenuBar: React.FC<MenuBarProps> = ({ className = '' }) => {
  const { 
    width, 
    height, 
    zoom, 
    setDimensions, 
    setZoom,
    fabricCanvas 
  } = useCanvasStore()
  
  const { 
    layers, 
    addLayer, 
    clearAllLayers 
  } = useLayerStore()
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  } = useHistoryStore()
  
  const { 
    theme,
    setTheme
  } = useUIStore()

  // 模态框状态
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [newCanvasWidth, setNewCanvasWidth] = useState('800')
  const [newCanvasHeight, setNewCanvasHeight] = useState('600')

  // 文件操作
  const handleNew = () => {
    setShowNewDialog(true)
  }

  const handleCreateNew = () => {
    const w = parseInt(newCanvasWidth) || 800
    const h = parseInt(newCanvasHeight) || 600
    setDimensions(w, h)
    clearAllLayers()
    clearHistory()
    addLayer({
      name: '背景图层',
      visible: true,
      opacity: 100,
      locked: false,
      type: 'raster',
    })
    setShowNewDialog(false)
  }

  const handleOpen = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.png,.jpg,.jpeg,.gif,.bmp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (file.type.startsWith('image/')) {
          // 处理图片文件
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string
            // TODO: 添加图片到 canvas
            console.log('Load image:', imageUrl)
          }
          reader.readAsDataURL(file)
        } else if (file.name.endsWith('.json')) {
          // 处理项目文件
          const text = await file.text()
          try {
            const projectData = JSON.parse(text)
            // TODO: 加载项目数据
            console.log('Load project:', projectData)
          } catch (error) {
            alert('无效的项目文件')
          }
        }
      }
    }
    input.click()
  }

  const handleSave = () => {
    if (!fabricCanvas) return
    
    const projectData = {
      canvas: fabricCanvas.toJSON(['id', 'selectable']),
      layers,
      metadata: {
        version: '2.0',
        created: new Date().toISOString(),
        width: fabricCanvas.width,
        height: fabricCanvas.height
      }
    }
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'miniPaint_project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = (format: 'png' | 'jpg' | 'webp') => {
    if (!fabricCanvas) return
    
    const dataURL = fabricCanvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality: format === 'jpg' ? 0.9 : 1,
      multiplier: 1
    })
    
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `miniPaint_export.${format}`
    a.click()
  }

  // 编辑操作
  const handleUndo = () => {
    undo()
  }

  const handleRedo = () => {
    redo()
  }

  const handleCopy = () => {
    const activeObject = fabricCanvas?.getActiveObject()
    if (activeObject) {
      // TODO: 实现复制功能
      console.log('Copy')
    }
  }

  const handlePaste = () => {
    // TODO: 实现粘贴功能
    console.log('Paste')
  }

  // 视图操作
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1)
    setZoom(newZoom)
  }

  const handleZoomFit = () => {
    setZoom(1)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const menuItems = [
    {
      label: '文件',
      items: [
        { label: '新建', shortcut: 'Ctrl+N', action: handleNew },
        { label: '打开', shortcut: 'Ctrl+O', action: handleOpen },
        { label: '保存', shortcut: 'Ctrl+S', action: handleSave },
        { type: 'divider' as const },
        { label: '导出为 PNG', action: () => handleExport('png') },
        { label: '导出为 JPG', action: () => handleExport('jpg') },
        { label: '导出为 WebP', action: () => handleExport('webp') },
      ]
    },
    {
      label: '编辑',
      items: [
        { 
          label: '撤销', 
          shortcut: 'Ctrl+Z', 
          action: handleUndo,
          disabled: !canUndo()
        },
        { 
          label: '重做', 
          shortcut: 'Ctrl+Y', 
          action: handleRedo,
          disabled: !canRedo()
        },
        { type: 'divider' as const },
        { label: '复制', shortcut: 'Ctrl+C', action: handleCopy },
        { label: '粘贴', shortcut: 'Ctrl+V', action: handlePaste },
      ]
    },
    {
      label: '视图',
      items: [
        { label: '放大', shortcut: 'Ctrl++', action: handleZoomIn },
        { label: '缩小', shortcut: 'Ctrl+-', action: handleZoomOut },
        { label: '适合窗口', shortcut: 'Ctrl+0', action: handleZoomFit },
        { type: 'divider' as const },
        { label: '工具面板', action: () => useUIStore.getState().togglePanel('tools') },
        { label: '图层面板', action: () => useUIStore.getState().togglePanel('layers') },
        { label: '属性面板', action: () => useUIStore.getState().togglePanel('properties') },
        { label: '颜色面板', action: () => useUIStore.getState().togglePanel('colors') },
        { label: '效果面板', action: () => useUIStore.getState().togglePanel('effects') },
        { type: 'divider' as const },
        { label: theme === 'dark' ? '浅色模式' : '深色模式', action: toggleTheme },
      ]
    },
    {
      label: '帮助',
      items: [
        { label: '关于 miniPaint', action: () => setShowAbout(true) },
      ]
    }
  ]

  return (
    <>
      <div className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="flex items-center h-10 px-4">
          {/* Logo */}
          <div className="flex items-center mr-6">
            <span className="font-bold text-lg text-primary-600">miniPaint</span>
          </div>

          {/* 菜单项 */}
          <nav className="flex items-center space-x-1">
            {menuItems.map((menu, index) => (
              <MenuDropdown key={index} menu={menu} />
            ))}
          </nav>

          {/* 右侧操作 */}
          <div className="ml-auto flex items-center space-x-2">
            {/* 撤销重做按钮 */}
            <button
              onClick={handleUndo}
              disabled={!canUndo()}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                canUndo() 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="撤销 (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo()}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                canRedo() 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="重做 (Ctrl+Y)"
            >
              ↷
            </button>
            
            <div className="w-px h-4 bg-gray-300 mx-2" />
            
            {/* 缩放显示 */}
            <div className="flex items-center text-sm text-gray-600">
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            
            {/* 画布尺寸显示 */}
            <div className="flex items-center text-sm text-gray-600">
              <span>{width} × {height}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 新建画布对话框 */}
      <Modal
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        title="新建画布"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="宽度"
              type="number"
              value={newCanvasWidth}
              onChange={setNewCanvasWidth}
              placeholder="800"
            />
            <Input
              label="高度"
              type="number"
              value={newCanvasHeight}
              onChange={setNewCanvasHeight}
              placeholder="600"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowNewDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateNew}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 关于对话框 */}
      <Modal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        title="关于 miniPaint"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">miniPaint</div>
            <div className="text-lg text-gray-600 mb-4">React 重构版</div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>基于 React 18 + TypeScript 的现代化绘图应用</p>
            <p>技术栈：Vite + UnoCSS + Zustand + Fabric.js</p>
            <p>版本：2.0.0</p>
            <p>完成进度：Phase 5 - Effects System Migration</p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowAbout(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// 菜单下拉组件
interface MenuDropdownProps {
  menu: {
    label: string
    items: Array<{
      label?: string
      shortcut?: string
      action?: () => void
      type?: 'divider'
    }>
  }
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ menu }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleItemClick = (action?: () => void) => {
    if (action) {
      action()
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        {menu.label}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-40"
          onMouseLeave={() => setIsOpen(false)}
        >
          {menu.items.map((item, index) => (
            item.type === 'divider' ? (
              <div key={index} className="border-t border-gray-200 my-1" />
            ) : (
              <button
                key={index}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => handleItemClick(item.action)}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400 ml-2">{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default MenuBar