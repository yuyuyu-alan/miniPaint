import React, { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'
import { useHistoryStore } from '@/stores/history'
import { useTools } from '@/hooks/useTools'
import { useCanvasViewport } from '@/hooks/useCanvasViewport'

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<fabric.Point | null>(null)
  const [tempObject, setTempObject] = useState<fabric.Object | null>(null)
  
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

  // 初始化 Fabric.js Canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = initializeCanvas(canvasRef.current)
      
      // 设置 canvas 事件监听
      canvas.on('selection:created', (e) => {
        console.log('Object selected:', e.selected)
      })

      canvas.on('selection:cleared', () => {
        console.log('Selection cleared')
      })

      canvas.on('object:added', (e) => {
        console.log('Object added:', e.target)
        // 保存历史状态
        saveState(`添加对象`)
      })

      canvas.on('object:removed', (e) => {
        console.log('Object removed:', e.target)
        // 保存历史状态
        saveState(`删除对象`)
      })

      canvas.on('object:modified', (e) => {
        console.log('Object modified:', e.target)
        // 保存历史状态
        saveState(`修改对象`)
      })

      canvas.on('path:created', (e) => {
        console.log('Path created:', e.path)
        // 保存历史状态
        saveState(`画笔绘制`)
      })

      // 监听鼠标事件用于工具系统
      canvas.on('mouse:down', handleMouseDown)
      canvas.on('mouse:move', handleMouseMove) 
      canvas.on('mouse:up', handleMouseUp)

      // 初始保存状态
      saveState('初始状态')
    }

    // 清理函数
    return () => {
      destroyCanvas()
    }
  }, [])

  // 鼠标按下事件
  const handleMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !e.e) return

    const pointer = fabricCanvas.getPointer(e.e)
    const point = new fabric.Point(pointer.x, pointer.y)
    
    setStartPoint(point)
    setIsDrawing(true)

    switch (activeTool) {
      case 'select':
        // 选择工具由 Fabric.js 自动处理
        break
      
      case 'brush':
        // 画笔工具由 Fabric.js drawing mode 自动处理
        break

      case 'rectangle':
      case 'circle':
        // 创建临时形状用于预览
        const tempShape = activeTool === 'rectangle' 
          ? new fabric.Rect({ left: point.x, top: point.y, width: 0, height: 0, fill: 'transparent', stroke: '#000', strokeWidth: 2 })
          : new fabric.Circle({ left: point.x, top: point.y, radius: 0, fill: 'transparent', stroke: '#000', strokeWidth: 2 })
        
        fabricCanvas.add(tempShape)
        setTempObject(tempShape)
        fabricCanvas.renderAll()
        break

      case 'line':
      case 'arrow':
        // 创建临时线条用于预览
        const tempLine = new fabric.Line([point.x, point.y, point.x, point.y], {
          stroke: '#000',
          strokeWidth: 2
        })
        fabricCanvas.add(tempLine)
        setTempObject(tempLine)
        fabricCanvas.renderAll()
        break

      case 'text':
        // 文本工具 - 直接创建文本
        createText(point)
        break

      default:
        console.log(`Tool ${activeTool} mouse down not implemented yet`)
    }
  }

  // 鼠标移动事件
  const handleMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
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
          fabricCanvas.renderAll()
        }
        break

      case 'circle':
        if (tempObject) {
          const radius = Math.abs(currentPoint.x - startPoint.x) / 2
          const left = startPoint.x
          const top = startPoint.y
          
          tempObject.set({ left, top, radius })
          fabricCanvas.renderAll()
        }
        break

      case 'line':
      case 'arrow':
        if (tempObject && tempObject instanceof fabric.Line) {
          tempObject.set({ x2: currentPoint.x, y2: currentPoint.y })
          fabricCanvas.renderAll()
        }
        break
    }
  }

  // 鼠标释放事件
  const handleMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
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
  }

  // 监听画布尺寸变化
  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.setDimensions({ width, height })
      fabricCanvas.renderAll()
    }
  }, [fabricCanvas, width, height])

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden"
    >
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
          
          {/* 网格背景 (可选) */}
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
            Phase 4 - Canvas Core 完成
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
    </div>
  )
}

export default CanvasArea