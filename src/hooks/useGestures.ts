import { useCallback, useRef, useEffect } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import * as fabric from 'fabric'

interface TouchPoint {
  x: number
  y: number
  id: number
}

interface GestureState {
  isActive: boolean
  type: 'pan' | 'zoom' | 'rotate' | null
  startDistance?: number
  startAngle?: number
  lastCenter?: { x: number; y: number }
}

export const useGestures = () => {
  const { fabricCanvas, setZoom, setOffset } = useCanvasStore()
  const gestureState = useRef<GestureState>({ isActive: false, type: null })
  const touchPoints = useRef<TouchPoint[]>([])

  // 获取两点间距离
  const getDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint): number => {
    const dx = touch1.x - touch2.x
    const dy = touch1.y - touch2.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // 获取两点间角度
  const getAngle = useCallback((touch1: TouchPoint, touch2: TouchPoint): number => {
    return Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x)
  }, [])

  // 获取多点中心
  const getCenter = useCallback((touches: TouchPoint[]): { x: number; y: number } => {
    const x = touches.reduce((sum, touch) => sum + touch.x, 0) / touches.length
    const y = touches.reduce((sum, touch) => sum + touch.y, 0) / touches.length
    return { x, y }
  }, [])

  // 转换Touch为TouchPoint
  const touchToPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    id: touch.identifier
  }), [])

  // 处理触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!fabricCanvas) return

    e.preventDefault()
    
    touchPoints.current = Array.from(e.touches).map(touchToPoint)
    
    if (touchPoints.current.length === 1) {
      // 单点触摸 - 准备平移
      gestureState.current = {
        isActive: true,
        type: 'pan',
        lastCenter: getCenter(touchPoints.current)
      }
    } else if (touchPoints.current.length === 2) {
      // 双点触摸 - 准备缩放/旋转
      const distance = getDistance(touchPoints.current[0], touchPoints.current[1])
      const angle = getAngle(touchPoints.current[0], touchPoints.current[1])
      
      gestureState.current = {
        isActive: true,
        type: 'zoom',
        startDistance: distance,
        startAngle: angle,
        lastCenter: getCenter(touchPoints.current)
      }
      
      // 禁用对象选择
      fabricCanvas.selection = false
    }
  }, [fabricCanvas, touchToPoint, getCenter, getDistance, getAngle])

  // 处理触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!fabricCanvas || !gestureState.current.isActive) return

    e.preventDefault()
    
    touchPoints.current = Array.from(e.touches).map(touchToPoint)
    const currentCenter = getCenter(touchPoints.current)
    
    if (gestureState.current.type === 'pan' && touchPoints.current.length === 1) {
      // 平移手势
      if (gestureState.current.lastCenter) {
        const deltaX = currentCenter.x - gestureState.current.lastCenter.x
        const deltaY = currentCenter.y - gestureState.current.lastCenter.y
        
        // 应用平移
        const currentOffset = fabricCanvas.viewportTransform
        if (currentOffset) {
          fabricCanvas.viewportTransform[4] += deltaX
          fabricCanvas.viewportTransform[5] += deltaY
          fabricCanvas.renderAll()
        }
      }
      
      gestureState.current.lastCenter = currentCenter
    } else if (gestureState.current.type === 'zoom' && touchPoints.current.length === 2) {
      // 缩放手势
      const currentDistance = getDistance(touchPoints.current[0], touchPoints.current[1])
      
      if (gestureState.current.startDistance) {
        const scale = currentDistance / gestureState.current.startDistance
        const currentZoom = fabricCanvas.getZoom()
        const newZoom = Math.max(0.1, Math.min(5, currentZoom * scale))
        
        // 以手势中心为缩放中心
        fabricCanvas.zoomToPoint(
          new fabric.Point(currentCenter.x, currentCenter.y),
          newZoom
        )
        
        gestureState.current.startDistance = currentDistance
      }
      
      gestureState.current.lastCenter = currentCenter
    }
  }, [fabricCanvas, touchToPoint, getCenter, getDistance])

  // 处理触摸结束
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!fabricCanvas) return

    touchPoints.current = Array.from(e.touches).map(touchToPoint)
    
    if (touchPoints.current.length === 0) {
      // 所有触摸结束
      gestureState.current = { isActive: false, type: null }
      
      // 恢复对象选择
      fabricCanvas.selection = true
    } else if (touchPoints.current.length === 1 && gestureState.current.type === 'zoom') {
      // 从双点变为单点 - 切换到平移
      gestureState.current = {
        isActive: true,
        type: 'pan',
        lastCenter: getCenter(touchPoints.current)
      }
    }
  }, [fabricCanvas, touchToPoint, getCenter])

  // 绑定手势事件到元素
  const bindGestures = useCallback((element: HTMLElement | null) => {
    if (!element) return

    // 添加触摸事件监听器
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    // 返回清理函数
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // 双击缩放
  const handleDoubleTap = useCallback((e: TouchEvent) => {
    if (!fabricCanvas || touchPoints.current.length !== 1) return

    e.preventDefault()
    
    const touch = touchPoints.current[0]
    const currentZoom = fabricCanvas.getZoom()
    const newZoom = currentZoom === 1 ? 2 : 1
    
    fabricCanvas.zoomToPoint(
      new fabric.Point(touch.x, touch.y),
      newZoom
    )
  }, [fabricCanvas])

  // 长按手势
  const handleLongPress = useCallback((e: TouchEvent) => {
    if (!fabricCanvas || touchPoints.current.length !== 1) return

    // 触发右键菜单或特殊操作
    const touch = touchPoints.current[0]
    console.log('Long press at:', touch.x, touch.y)
  }, [fabricCanvas])

  return {
    // 绑定方法
    bindGestures,
    
    // 手势状态
    isGestureActive: gestureState.current.isActive,
    gestureType: gestureState.current.type,
    
    // 手势处理器
    handleDoubleTap,
    handleLongPress
  }
}