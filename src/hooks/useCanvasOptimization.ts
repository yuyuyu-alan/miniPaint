import { useCallback, useRef, useMemo } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import * as fabric from 'fabric'

interface OptimizationOptions {
  renderDebounceMs?: number
  batchOperationTimeout?: number
  maxObjectsBeforeVirtualization?: number
}

export const useCanvasOptimization = (options: OptimizationOptions = {}) => {
  const {
    renderDebounceMs = 16, // 60fps
    batchOperationTimeout = 100,
    maxObjectsBeforeVirtualization = 1000
  } = options

  const { fabricCanvas } = useCanvasStore()
  const renderTimer = useRef<number>()
  const batchTimer = useRef<number>()
  const isBatching = useRef(false)
  const pendingOperations = useRef<Array<() => void>>([])

  // 防抖渲染
  const debouncedRender = useCallback(() => {
    if (!fabricCanvas) return

    if (renderTimer.current) {
      cancelAnimationFrame(renderTimer.current)
    }

    renderTimer.current = requestAnimationFrame(() => {
      fabricCanvas.renderAll()
    })
  }, [fabricCanvas])

  // 批量操作管理
  const startBatch = useCallback(() => {
    if (!fabricCanvas) return

    isBatching.current = true
    fabricCanvas.renderOnAddRemove = false
    
    // 设置批量操作超时
    if (batchTimer.current) {
      clearTimeout(batchTimer.current)
    }
    
    batchTimer.current = setTimeout(() => {
      endBatch()
    }, batchOperationTimeout) as unknown as number
  }, [fabricCanvas, batchOperationTimeout])

  const endBatch = useCallback(() => {
    if (!fabricCanvas || !isBatching.current) return

    isBatching.current = false
    fabricCanvas.renderOnAddRemove = true
    
    if (batchTimer.current) {
      clearTimeout(batchTimer.current)
      batchTimer.current = undefined
    }

    // 执行所有待处理的操作
    pendingOperations.current.forEach(operation => operation())
    pendingOperations.current = []
    
    debouncedRender()
  }, [fabricCanvas, debouncedRender])

  // 批量添加对象
  const batchAddObjects = useCallback((objects: fabric.Object[]) => {
    if (!fabricCanvas) return

    startBatch()
    
    objects.forEach(obj => {
      fabricCanvas.add(obj)
    })
    
    endBatch()
  }, [fabricCanvas, startBatch, endBatch])

  // 批量移除对象
  const batchRemoveObjects = useCallback((objects: fabric.Object[]) => {
    if (!fabricCanvas) return

    startBatch()
    
    objects.forEach(obj => {
      fabricCanvas.remove(obj)
    })
    
    endBatch()
  }, [fabricCanvas, startBatch, endBatch])

  // 优化的对象操作
  const optimizedOperation = useCallback((operation: () => void) => {
    if (!fabricCanvas) return

    if (isBatching.current) {
      pendingOperations.current.push(operation)
    } else {
      operation()
      debouncedRender()
    }
  }, [fabricCanvas, debouncedRender])

  // 虚拟化管理 - 当对象过多时隐藏不可见的对象
  const enableVirtualization = useCallback(() => {
    if (!fabricCanvas) return

    const objects = fabricCanvas.getObjects()
    if (objects.length < maxObjectsBeforeVirtualization) return

    const viewport = fabricCanvas.viewportTransform
    if (!viewport) return

    const canvasWidth = fabricCanvas.width || 0
    const canvasHeight = fabricCanvas.height || 0

    objects.forEach(obj => {
      const objBounds = obj.getBoundingRect()
      
      // 检查对象是否在视口内
      const isVisible = !(
        objBounds.left > canvasWidth ||
        objBounds.top > canvasHeight ||
        objBounds.left + objBounds.width < 0 ||
        objBounds.top + objBounds.height < 0
      )

      // 设置对象的可见性和事件处理
      if (isVisible) {
        obj.visible = true
        obj.evented = true
      } else {
        obj.visible = false
        obj.evented = false
      }
    })

    debouncedRender()
  }, [fabricCanvas, maxObjectsBeforeVirtualization, debouncedRender])

  // 内存优化 - 清理不必要的缓存
  const optimizeMemory = useCallback(() => {
    if (!fabricCanvas) return

    // 清理fabric.js内部缓存
    fabricCanvas.getObjects().forEach(obj => {
      // 清理对象缓存
      if ((obj as any)._cacheCanvas) {
        (obj as any)._cacheCanvas = undefined
      }
      if ((obj as any)._cacheContext) {
        (obj as any)._cacheContext = undefined
      }
    })

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc()
    }
  }, [fabricCanvas])

  // 性能监控
  const performanceStats = useMemo(() => {
    if (!fabricCanvas) return null

    const objects = fabricCanvas.getObjects()
    return {
      objectCount: objects.length,
      isVirtualizationNeeded: objects.length > maxObjectsBeforeVirtualization,
      isBatching: isBatching.current,
      canvasSize: {
        width: fabricCanvas.width,
        height: fabricCanvas.height
      }
    }
  }, [fabricCanvas, maxObjectsBeforeVirtualization])

  // 清理函数
  const cleanup = useCallback(() => {
    if (renderTimer.current) {
      cancelAnimationFrame(renderTimer.current)
    }
    if (batchTimer.current) {
      clearTimeout(batchTimer.current)
    }
    pendingOperations.current = []
    isBatching.current = false
  }, [])

  return {
    // 渲染优化
    debouncedRender,
    
    // 批量操作
    startBatch,
    endBatch,
    batchAddObjects,
    batchRemoveObjects,
    optimizedOperation,
    
    // 虚拟化
    enableVirtualization,
    
    // 内存优化
    optimizeMemory,
    
    // 性能统计
    performanceStats,
    
    // 清理
    cleanup
  }
}

// 扩展Window接口以支持gc函数
declare global {
  interface Window {
    gc?: () => void
  }
}