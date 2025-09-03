import { useCallback, useEffect, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useUIStore } from '@/stores/ui'
import * as fabric from 'fabric'

export const useCanvasViewport = () => {
  const { 
    fabricCanvas, 
    zoom, 
    offset, 
    setZoom, 
    setOffset,
    width,
    height
  } = useCanvasStore()
  
  const { keyPressed } = useUIStore()
  const isPanning = useRef(false)
  const lastPosition = useRef<{ x: number; y: number } | null>(null)

  // 缩放到指定级别
  const zoomTo = useCallback((newZoom: number, center?: { x: number; y: number }) => {
    if (!fabricCanvas) return

    const clampedZoom = Math.min(Math.max(newZoom, 0.1), 5)
    
    if (center) {
      const point = new fabric.Point(center.x, center.y)
      fabricCanvas.zoomToPoint(point, clampedZoom)
    } else {
      const canvasCenter = fabricCanvas.getCenter()
      const centerPoint = new fabric.Point(canvasCenter.left, canvasCenter.top)
      fabricCanvas.zoomToPoint(centerPoint, clampedZoom)
    }
    
    setZoom(clampedZoom)
    fabricCanvas.renderAll()
  }, [fabricCanvas, setZoom])

  // 缩放到适合窗口
  const zoomToFit = useCallback(() => {
    if (!fabricCanvas) return

    const objects = fabricCanvas.getObjects()
    if (objects.length === 0) {
      zoomTo(1)
      return
    }

    // 计算所有对象的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    objects.forEach(obj => {
      const bounds = obj.getBoundingRect()
      minX = Math.min(minX, bounds.left)
      minY = Math.min(minY, bounds.top)
      maxX = Math.max(maxX, bounds.left + bounds.width)
      maxY = Math.max(maxY, bounds.top + bounds.height)
    })

    const objectWidth = maxX - minX
    const objectHeight = maxY - minY
    
    if (objectWidth === 0 || objectHeight === 0) {
      zoomTo(1)
      return
    }

    // 计算适合的缩放比例
    const scaleX = (width - 100) / objectWidth  // 留100px边距
    const scaleY = (height - 100) / objectHeight
    const newZoom = Math.min(scaleX, scaleY, 2) // 最大放大到2倍

    // 居中显示
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    fabricCanvas.setZoom(newZoom)
    fabricCanvas.absolutePan(new fabric.Point(
      width / 2 - centerX * newZoom,
      height / 2 - centerY * newZoom
    ))
    
    setZoom(newZoom)
    fabricCanvas.renderAll()
  }, [fabricCanvas, zoomTo, width, height, setZoom])

  // 缩放到实际大小
  const zoomToActualSize = useCallback(() => {
    zoomTo(1)
    
    // 居中画布
    if (fabricCanvas) {
      fabricCanvas.absolutePan(new fabric.Point(0, 0))
      fabricCanvas.renderAll()
    }
  }, [zoomTo, fabricCanvas])

  // 放大
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 5)
    zoomTo(newZoom)
  }, [zoom, zoomTo])

  // 缩小
  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.1)
    zoomTo(newZoom)
  }, [zoom, zoomTo])

  // 平移画布
  const panBy = useCallback((deltaX: number, deltaY: number) => {
    if (!fabricCanvas) return

    const currentPan = fabricCanvas.viewportTransform
    if (!currentPan) return

    currentPan[4] += deltaX
    currentPan[5] += deltaY
    
    fabricCanvas.setViewportTransform(currentPan)
    fabricCanvas.renderAll()
    
    setOffset({ x: currentPan[4], y: currentPan[5] })
  }, [fabricCanvas, setOffset])

  // 平移到指定位置
  const panTo = useCallback((x: number, y: number) => {
    if (!fabricCanvas) return

    fabricCanvas.absolutePan(new fabric.Point(x, y))
    fabricCanvas.renderAll()
    
    setOffset({ x, y })
  }, [fabricCanvas, setOffset])

  // 重置视图
  const resetView = useCallback(() => {
    if (!fabricCanvas) return

    fabricCanvas.setZoom(1)
    fabricCanvas.absolutePan(new fabric.Point(0, 0))
    fabricCanvas.renderAll()
    
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [fabricCanvas, setZoom, setOffset])

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!fabricCanvas) return

    e.preventDefault()

    const delta = e.deltaY
    const pointer = fabricCanvas.getPointer(e)
    const newZoom = delta > 0 ? zoom / 1.1 : zoom * 1.1
    
    zoomTo(Math.min(Math.max(newZoom, 0.1), 5), pointer)
  }, [fabricCanvas, zoom, zoomTo])

  // 鼠标平移
  const handleMouseDown = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !e.e) return

    // 检查是否按住空格键或中键进行平移
    const spacePressed = keyPressed.has(' ')
    const middleButton = (e.e as MouseEvent).button === 1
    
    if (spacePressed || middleButton) {
      isPanning.current = true
      const pointer = fabricCanvas.getPointer(e.e)
      lastPosition.current = { x: pointer.x, y: pointer.y }
      
      // 临时禁用对象选择
      fabricCanvas.selection = false
      fabricCanvas.defaultCursor = 'grabbing'
      fabricCanvas.hoverCursor = 'grabbing'
    }
  }, [fabricCanvas, keyPressed])

  const handleMouseMove = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvas || !isPanning.current || !lastPosition.current || !e.e) return

    const pointer = fabricCanvas.getPointer(e.e)
    const deltaX = pointer.x - lastPosition.current.x
    const deltaY = pointer.y - lastPosition.current.y
    
    panBy(deltaX, deltaY)
    
    lastPosition.current = { x: pointer.x, y: pointer.y }
  }, [fabricCanvas, panBy])

  const handleMouseUp = useCallback(() => {
    if (!fabricCanvas || !isPanning.current) return

    isPanning.current = false
    lastPosition.current = null
    
    // 恢复对象选择
    fabricCanvas.selection = true
    fabricCanvas.defaultCursor = 'default'
    fabricCanvas.hoverCursor = 'move'
  }, [fabricCanvas])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return

      // 避免在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Equal':
        case 'NumpadAdd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomIn()
          }
          break
        case 'Minus':
        case 'NumpadSubtract':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomOut()
          }
          break
        case 'Digit0':
        case 'Numpad0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomToActualSize()
          }
          break
        case 'Digit9':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomToFit()
          }
          break
        case 'Space':
          e.preventDefault()
          if (!isPanning.current) {
            fabricCanvas.defaultCursor = 'grab'
          }
          break
        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault()
            panBy(0, -20)
          }
          break
        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault()
            panBy(0, 20)
          }
          break
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault()
            panBy(-20, 0)
          }
          break
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault()
            panBy(20, 0)
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && fabricCanvas) {
        fabricCanvas.defaultCursor = 'default'
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [fabricCanvas, zoomIn, zoomOut, zoomToActualSize, zoomToFit, panBy])

  // 设置 canvas 事件监听
  useEffect(() => {
    if (!fabricCanvas) return

    const canvasElement = fabricCanvas.upperCanvasEl
    if (!canvasElement) return

    // 滚轮缩放
    canvasElement.addEventListener('wheel', handleWheel, { passive: false })

    // 鼠标平移
    fabricCanvas.on('mouse:down', handleMouseDown)
    fabricCanvas.on('mouse:move', handleMouseMove)
    fabricCanvas.on('mouse:up', handleMouseUp)

    return () => {
      canvasElement.removeEventListener('wheel', handleWheel)
      fabricCanvas.off('mouse:down', handleMouseDown)
      fabricCanvas.off('mouse:move', handleMouseMove)
      fabricCanvas.off('mouse:up', handleMouseUp)
    }
  }, [fabricCanvas, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  return {
    zoomTo,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToActualSize,
    resetView,
    panBy,
    panTo,
    zoom,
    offset,
    isPanning: isPanning.current
  }
}