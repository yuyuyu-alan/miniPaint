import { useCallback, useEffect, useRef } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    fabricCanvas,
    width,
    height,
    zoom,
    backgroundColor,
    initializeCanvas,
    destroyCanvas,
    setFabricCanvas,
  } = useCanvasStore()

  const { layers, activeLayerId } = useLayerStore()

  // 初始化 Canvas
  const initCanvas = useCallback((element?: HTMLCanvasElement) => {
    const canvasElement = element || canvasRef.current
    if (!canvasElement) return null

    // 如果已有 Canvas 实例，先销毁
    if (fabricCanvas) {
      destroyCanvas()
    }

    const canvas = initializeCanvas(canvasElement)
    
    // 设置 Canvas 事件监听器
    setupCanvasEvents(canvas)
    
    return canvas
  }, [fabricCanvas, destroyCanvas, initializeCanvas])

  // 设置 Canvas 事件监听器
  const setupCanvasEvents = useCallback((canvas: fabric.Canvas) => {
    // 对象选择事件
    canvas.on('selection:created', (e) => {
      // 处理对象选择
    })

    canvas.on('selection:updated', (e) => {
      // 处理选择更新
    })

    canvas.on('selection:cleared', (e) => {
      // 处理选择清除
    })

    // 对象修改事件
    canvas.on('object:modified', (e) => {
      // 触发历史记录保存
      // TODO: 添加历史记录
    })

    // 画布修改事件
    canvas.on('path:created', (e) => {
      // 自由绘制完成
      // TODO: 添加历史记录
    })
  }, [])

  // 添加对象到画布
  const addObject = useCallback((object: fabric.Object) => {
    if (!fabricCanvas) return

    fabricCanvas.add(object)
    fabricCanvas.renderAll()
  }, [fabricCanvas])

  // 删除选中对象
  const deleteSelected = useCallback(() => {
    if (!fabricCanvas) return

    const activeObjects = fabricCanvas.getActiveObjects()
    if (activeObjects.length > 0) {
      fabricCanvas.remove(...activeObjects)
      fabricCanvas.discardActiveObject()
      fabricCanvas.renderAll()
    }
  }, [fabricCanvas])

  // 复制选中对象
  const copySelected = useCallback(async () => {
    if (!fabricCanvas) return null

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) return null

    try {
      const cloned = await new Promise<fabric.Object>((resolve) => {
        activeObject.clone((cloned: fabric.Object) => {
          resolve(cloned)
        })
      })
      return cloned
    } catch (error) {
      console.error('Failed to copy object:', error)
      return null
    }
  }, [fabricCanvas])

  // 粘贴对象
  const pasteObject = useCallback((object: fabric.Object) => {
    if (!fabricCanvas || !object) return

    object.set({
      left: (object.left || 0) + 10,
      top: (object.top || 0) + 10,
    })

    fabricCanvas.add(object)
    fabricCanvas.setActiveObject(object)
    fabricCanvas.renderAll()
  }, [fabricCanvas])

  // 清空画布
  const clearCanvas = useCallback(() => {
    if (!fabricCanvas) return

    fabricCanvas.clear()
    fabricCanvas.renderAll()
  }, [fabricCanvas])

  // 导出画布
  const exportCanvas = useCallback((
    format: 'png' | 'jpg' | 'svg' = 'png',
    options?: {
      quality?: number
      multiplier?: number
    }
  ) => {
    if (!fabricCanvas) return null

    switch (format) {
      case 'png':
        return fabricCanvas.toDataURL({
          format: 'png',
          multiplier: options?.multiplier || 1,
        })
      case 'jpg':
        return fabricCanvas.toDataURL({
          format: 'jpeg',
          quality: options?.quality || 0.8,
          multiplier: options?.multiplier || 1,
        })
      case 'svg':
        return fabricCanvas.toSVG()
      default:
        return null
    }
  }, [fabricCanvas])

  // 从 JSON 加载画布
  const loadFromJSON = useCallback((json: string) => {
    if (!fabricCanvas) return

    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.renderAll()
    })
  }, [fabricCanvas])

  // 导出到 JSON
  const toJSON = useCallback(() => {
    if (!fabricCanvas) return null
    return JSON.stringify(fabricCanvas.toJSON())
  }, [fabricCanvas])

  // 获取画布中心点
  const getCenter = useCallback(() => {
    if (!fabricCanvas) return { x: 0, y: 0 }
    
    const center = fabricCanvas.getCenter()
    return { x: center.left, y: center.top }
  }, [fabricCanvas])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        destroyCanvas()
      }
    }
  }, [fabricCanvas, destroyCanvas])

  return {
    canvasRef,
    canvas: fabricCanvas,
    width,
    height,
    zoom,
    backgroundColor,
    layers,
    activeLayerId,
    
    // 方法
    initCanvas,
    addObject,
    deleteSelected,
    copySelected,
    pasteObject,
    clearCanvas,
    exportCanvas,
    loadFromJSON,
    toJSON,
    getCenter,
  }
}