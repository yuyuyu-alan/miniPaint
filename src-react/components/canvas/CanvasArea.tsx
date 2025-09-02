import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'
import { useHistoryStore } from '@/stores/history'
import { useTools } from '@/hooks/useTools'
import { useCanvasViewport } from '@/hooks/useCanvasViewport'
import { useFileDrop } from '@/hooks/useFileDrop'
import { useGestures } from '@/hooks/useGestures'
import { useContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<fabric.Point | null>(null)
  const [tempObject, setTempObject] = useState<fabric.Object | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropMessage, setDropMessage] = useState<string | null>(null)
  
  const { 
    fabricCanvas, 
    width, 
    height, 
    zoom, 
    initializeCanvas, 
    destroyCanvas 
  } = useCanvasStore()
  
  const { activeLayerId } = useLayerStore()
  const { saveState } = useHistoryStore()
  const { activeTool, createShape, createText, createLine } = useTools()
  const { zoomIn, zoomOut, zoomToFit, zoomToActualSize, resetView } = useCanvasViewport()

  // 简化的性能优化 - 安全实现
  const debouncedRender = useCallback(() => {
    if (fabricCanvas) {
      // 使用requestAnimationFrame进行渲染优化
      requestAnimationFrame(() => {
        fabricCanvas.renderAll()
      })
    }
  }, [fabricCanvas])

  // 文件拖拽功能 - 安全实现
  const { bindDropZone } = useFileDrop({
    onFileAccepted: (file) => {
      setDropMessage(`正在导入: ${file.name}`)
      setIsDragOver(false)
    },
    onFileRejected: (file, reason) => {
      setDropMessage(`导入失败: ${reason}`)
      setIsDragOver(false)
      setTimeout(() => setDropMessage(null), 3000)
    },
    onImportComplete: (success) => {
      if (success) {
        setDropMessage('导入成功!')
      }
      setTimeout(() => setDropMessage(null), 2000)
    }
  })

  // 右键菜单功能 - 安全实现
  const { showContextMenu, ContextMenuComponent } = useContextMenu()

  // 手势支持 - 安全实现
  const { bindGestures, isGestureActive } = useGestures()

  // 初始化 Fabric.js Canvas - 只在组件挂载时执行一次
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      try {
        const canvas = initializeCanvas(canvasRef.current)
        
        // 设置基础事件监听
        canvas.on('selection:created', (e) => {
          console.log('Object selected:', e.selected)
        })

        canvas.on('selection:cleared', () => {
          console.log('Selection cleared')
        })

        canvas.on('object:added', (e) => {
          console.log('Object added:', e.target)
          setTimeout(() => saveState(`添加对象`), 100)
        })

        canvas.on('object:removed', (e) => {
          console.log('Object removed:', e.target)
          setTimeout(() => saveState(`删除对象`), 100)
        })

        canvas.on('object:modified', (e) => {
          console.log('Object modified:', e.target)
          setTimeout(() => saveState(`修改对象`), 100)
        })

        canvas.on('path:created', (e) => {
          console.log('Path created:', e.path)
          setTimeout(() => saveState(`画笔绘制`), 100)
        })

        // 监听鼠标事件
        canvas.on('mouse:down', handleMouseDown)
        canvas.on('mouse:move', handleMouseMove)
        canvas.on('mouse:up', handleMouseUp)

        // 右键菜单事件 - 安全实现
        canvas.on('mouse:down', (e) => {
          if (e.e && (e.e as MouseEvent).button === 2) {
            handleRightClick(e.e as MouseEvent)
          }
        })

        // 初始保存状态
        setTimeout(() => saveState('初始状态'), 200)
      } catch (error) {
        console.error('Canvas initialization failed:', error)
      }
    }

    // 清理函数
    return () => {
      if (fabricCanvas) {
        try {
          destroyCanvas()
        } catch (error) {
          console.warn('Canvas cleanup error:', error)
        }
      }
    }
  }, []) // 空依赖数组，只在挂载时执行

  // 安全地绑定拖拽功能
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = bindDropZone(containerRef.current)
      return cleanup
    }
  }, [bindDropZone])

  // 安全地绑定手势功能
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = bindGestures(containerRef.current)
      return cleanup
    }
  }, [bindGestures])

  // 处理拖拽状态
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleDragEnter = () => setIsDragOver(true)
    const handleDragLeave = (e: DragEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        setIsDragOver(false)
      }
    }

    container.addEventListener('dragenter', handleDragEnter)
    container.addEventListener('dragleave', handleDragLeave)

    return () => {
      container.removeEventListener('dragenter', handleDragEnter)
      container.removeEventListener('dragleave', handleDragLeave)
    }
  }, [])

  // 鼠标按下事件
  const handleMouseDown = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !e.e) return

    const pointer = fabricCanvas.getPointer(e.e)
    const point = new fabric.Point(pointer.x, pointer.y)
    
    setStartPoint(point)
    setIsDrawing(true)

    switch (activeTool) {
      case 'select':
        break
      
      case 'brush':
        break

      case 'rectangle':
      case 'circle':
        const tempShape = activeTool === 'rectangle' 
          ? new fabric.Rect({ left: point.x, top: point.y, width: 0, height: 0, fill: 'transparent', stroke: '#000', strokeWidth: 2 })
          : new fabric.Circle({ left: point.x, top: point.y, radius: 0, fill: 'transparent', stroke: '#000', strokeWidth: 2 })
        
        fabricCanvas.add(tempShape)
        setTempObject(tempShape)
        debouncedRender()
        break

      case 'line':
      case 'arrow':
        const tempLine = new fabric.Line([point.x, point.y, point.x, point.y], {
          stroke: '#000',
          strokeWidth: 2
        })
        fabricCanvas.add(tempLine)
        setTempObject(tempLine)
        debouncedRender()
        break

      case 'text':
        createText(point)
        break

      default:
        console.log(`Tool ${activeTool} mouse down not implemented yet`)
    }
  }, [fabricCanvas, activeTool, createText])

  // 鼠标移动事件
  const handleMouseMove = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !e.e || !isDrawing || !startPoint) return

    const pointer = fabricCanvas.getPointer(e.e)
    const currentPoint = new fabric.Point(pointer.x, pointer.y)

    switch (activeTool) {
      case 'rectangle':
        if (tempObject) {
          const width = Math.abs(currentPoint.x - startPoint.x)
          const height = Math.abs(currentPoint.y - startPoint.y)
          const left = Math.min(startPoint.x, currentPoint.x)
          const top = Math.min(startPoint.y, currentPoint.y)
          
          tempObject.set({ left, top, width, height })
          debouncedRender()
        }
        break

      case 'circle':
        if (tempObject) {
          const radius = Math.abs(currentPoint.x - startPoint.x) / 2
          const left = startPoint.x
          const top = startPoint.y
          
          tempObject.set({ left, top, radius })
          debouncedRender()
        }
        break

      case 'line':
      case 'arrow':
        if (tempObject && tempObject instanceof fabric.Line) {
          tempObject.set({ x2: currentPoint.x, y2: currentPoint.y })
          debouncedRender()
        }
        break
    }
  }, [fabricCanvas, activeTool, isDrawing, startPoint, tempObject])

  // 鼠标释放事件
  const handleMouseUp = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !isDrawing) return

    setIsDrawing(false)

    if (tempObject && startPoint) {
      const pointer = fabricCanvas.getPointer(e.e)
      const endPoint = new fabric.Point(pointer.x, pointer.y)

      // 移除临时对象
      fabricCanvas.remove(tempObject)

      // 创建最终对象
      switch (activeTool) {
        case 'rectangle':
        case 'circle':
          createShape(activeTool, startPoint, endPoint)
          break

        case 'line':
        case 'arrow':
          createLine(startPoint, endPoint)
          break
      }
    }

    setStartPoint(null)
    setTempObject(null)
  }, [fabricCanvas, isDrawing, tempObject, startPoint, activeTool, createShape, createLine])

  // 右键菜单处理 - 安全实现
  const handleRightClick = useCallback((e: MouseEvent) => {
    if (!fabricCanvas) return

    try {
      const activeObject = fabricCanvas.getActiveObject()
      const menuItems: ContextMenuItem[] = []

      if (activeObject) {
        // 有选中对象时的菜单
        menuItems.push(
          { id: 'delete', label: '删除', icon: '🗑️', shortcut: 'Delete', onClick: () => {
            fabricCanvas.remove(activeObject)
            fabricCanvas.renderAll()
            setTimeout(() => saveState('删除对象'), 50)
          }},
          { separator: true } as ContextMenuItem,
          { id: 'duplicate', label: '复制对象', icon: '📄', onClick: () => {
            activeObject.clone().then((cloned: fabric.Object) => {
              cloned.set({
                left: (cloned.left || 0) + 10,
                top: (cloned.top || 0) + 10,
              })
              fabricCanvas.add(cloned)
              fabricCanvas.setActiveObject(cloned)
              fabricCanvas.renderAll()
              setTimeout(() => saveState('复制对象'), 50)
            })
          }}
        )
      } else {
        // 空白区域的菜单
        menuItems.push(
          { id: 'select-all', label: '全选', icon: '🔲', shortcut: 'Ctrl+A', onClick: () => {
            const allObjects = fabricCanvas.getObjects()
            if (allObjects.length > 0) {
              const selection = new fabric.ActiveSelection(allObjects, {
                canvas: fabricCanvas,
              })
              fabricCanvas.setActiveObject(selection)
              fabricCanvas.renderAll()
            }
          }},
          { id: 'clear-selection', label: '取消选择', icon: '❌', shortcut: 'Ctrl+D', onClick: () => {
            fabricCanvas.discardActiveObject()
            fabricCanvas.renderAll()
          }}
        )
      }

      showContextMenu(e, menuItems)
    } catch (error) {
      console.warn('Right click menu error:', error)
    }
  }, [fabricCanvas, saveState, showContextMenu])

  // 监听画布尺寸变化 - 简化版本
  useEffect(() => {
    if (fabricCanvas && width && height) {
      try {
        fabricCanvas.setDimensions({ width, height })
        debouncedRender()
      } catch (error) {
        console.warn('Failed to set canvas dimensions:', error)
      }
    }
  }, [fabricCanvas, width, height])

  return (
    <div 
      ref={containerRef}
      className={`flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden transition-all ${
        isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
      }`}
    >
      {/* 拖拽提示覆盖层 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
            <div className="text-center">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-lg font-medium text-gray-800">拖拽文件到此处</p>
              <p className="text-sm text-gray-600">支持 JPG, PNG, GIF, WebP, SVG</p>
            </div>
          </div>
        </div>
      )}

      {/* 导入状态消息 */}
      {dropMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border">
            <span className="text-sm text-gray-700">{dropMessage}</span>
          </div>
        </div>
      )}

      {/* 画布容器 */}
      <div className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
        {/* 画布信息栏 */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>画布: {width} × {height}px</span>
            <span>缩放: {Math.round(zoom * 100)}%</span>
            {activeLayerId && (
              <span>图层: {activeLayerId}</span>
            )}
          </div>
        </div>
        
        {/* 画布主体 */}
        <div 
          className="relative bg-white"
          style={{ 
            width: Math.max(width, 300), 
            height: Math.max(height, 200) 
          }}
        >
          <canvas
            ref={canvasRef}
            className="block"
            style={{
              border: '1px solid #e5e5e5',
              cursor: activeTool === 'select' ? 'default' : 'crosshair'
            }}
          />
          
          {/* 网格背景 */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`
            }}
          />
        </div>
      </div>

      {/* 画布控制器 */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-gray-600">
            用户体验优化完成
          </span>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-gray-600">
            当前工具: {activeTool || 'select'}
          </span>
        </div>
        
        {isDrawing && (
          <div className="bg-blue-500/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <span className="text-sm text-white">
              绘制中...
            </span>
          </div>
        )}

        {isGestureActive && (
          <div className="bg-purple-500/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <span className="text-sm text-white">
              手势操作中...
            </span>
          </div>
        )}
      </div>

      {/* 缩放控制器 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded border border-gray-300 flex items-center justify-center hover:bg-white text-gray-700 text-sm font-bold"
          title="放大 (Ctrl + +)"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded border border-gray-300 flex items-center justify-center hover:bg-white text-gray-700 text-sm font-bold"
          title="缩小 (Ctrl + -)"
        >
          −
        </button>
        <button
          onClick={zoomToActualSize}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded border border-gray-300 flex items-center justify-center hover:bg-white text-gray-700 text-xs"
          title="实际大小 (Ctrl + 0)"
        >
          1:1
        </button>
        <button
          onClick={zoomToFit}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded border border-gray-300 flex items-center justify-center hover:bg-white text-gray-700 text-xs"
          title="适合窗口 (Ctrl + 9)"
        >
          ⌂
        </button>
      </div>

      {/* 视图重置按钮 */}
      <div className="absolute top-4 right-4">
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded border border-gray-300 flex items-center hover:bg-white text-gray-700 text-xs"
          title="重置视图"
        >
          重置视图
        </button>
      </div>

      {/* 右键菜单 */}
      {ContextMenuComponent}
    </div>
  )
}

export default CanvasArea