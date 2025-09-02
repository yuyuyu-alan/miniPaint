import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as fabric from 'fabric'
import type { CanvasState } from '@/types'

interface CanvasStore extends CanvasState {
  // 操作方法
  setDimensions: (width: number, height: number) => void
  setZoom: (zoom: number, center?: { x: number; y: number }) => void
  setOffset: (offset: { x: number; y: number }) => void
  setBackgroundColor: (color: string) => void
  setFabricCanvas: (canvas: fabric.Canvas) => void
  
  // Canvas 操作方法
  zoomToFit: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  centerCanvas: () => void
  
  // 初始化和清理
  initializeCanvas: (element: HTMLCanvasElement) => fabric.Canvas
  destroyCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    width: 800,
    height: 600,
    zoom: 1,
    offset: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    fabricCanvas: null,

    // 基础设置方法
    setDimensions: (width, height) => {
      const { fabricCanvas } = get()
      set({ width, height })
      
      if (fabricCanvas) {
        fabricCanvas.setDimensions({ width, height })
        fabricCanvas.renderAll()
      }
    },

    setZoom: (zoom, center) => {
      const { fabricCanvas } = get()
      const clampedZoom = Math.min(Math.max(zoom, 0.1), 5)
      
      set({ zoom: clampedZoom })
      
      if (fabricCanvas) {
        if (center) {
          fabricCanvas.zoomToPoint(new fabric.Point(center.x, center.y), clampedZoom)
        } else {
          const canvasCenter = fabricCanvas.getCenter()
          const centerPoint = new fabric.Point(canvasCenter.left, canvasCenter.top)
          fabricCanvas.zoomToPoint(centerPoint, clampedZoom)
        }
        fabricCanvas.renderAll()
      }
    },

    setOffset: (offset) => {
      const { fabricCanvas } = get()
      set({ offset })
      
      if (fabricCanvas) {
        fabricCanvas.relativePan(new fabric.Point(offset.x, offset.y))
        fabricCanvas.renderAll()
      }
    },

    setBackgroundColor: (color) => {
      const { fabricCanvas } = get()
      set({ backgroundColor: color })
      
      if (fabricCanvas) {
        fabricCanvas.backgroundColor = color
        fabricCanvas.renderAll()
      }
    },

    setFabricCanvas: (canvas) => {
      set({ fabricCanvas: canvas })
    },

    // Canvas 操作方法
    zoomToFit: () => {
      const { fabricCanvas, width, height } = get()
      if (!fabricCanvas) return

      const objects = fabricCanvas.getObjects()
      if (objects.length === 0) return

      const group = new fabric.Group(objects)
      const groupWidth = group.width || 1
      const groupHeight = group.height || 1
      
      const scaleX = width / groupWidth
      const scaleY = height / groupHeight
      const zoom = Math.min(scaleX, scaleY, 1) * 0.9

      fabricCanvas.setZoom(zoom)
      fabricCanvas.centerObject(group)
      set({ zoom })
    },

    zoomIn: () => {
      const { zoom } = get()
      get().setZoom(zoom * 1.1)
    },

    zoomOut: () => {
      const { zoom } = get()
      get().setZoom(zoom / 1.1)
    },

    resetZoom: () => {
      get().setZoom(1)
      get().centerCanvas()
    },

    centerCanvas: () => {
      const { fabricCanvas, width, height } = get()
      if (!fabricCanvas) return

      const center = new fabric.Point(width / 2, height / 2)
      fabricCanvas.absolutePan(center)
      fabricCanvas.renderAll()
    },

    // 初始化和清理
    initializeCanvas: (element) => {
      const { width, height, backgroundColor } = get()
      
      const canvas = new fabric.Canvas(element, {
        width,
        height,
        backgroundColor,
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: false,
      })

      // 设置默认选择样式
      canvas.selectionColor = 'rgba(100, 100, 255, 0.3)'
      canvas.selectionBorderColor = 'rgba(100, 100, 255, 0.8)'
      canvas.selectionLineWidth = 2

      set({ fabricCanvas: canvas })
      return canvas
    },

    destroyCanvas: () => {
      const { fabricCanvas } = get()
      if (fabricCanvas) {
        fabricCanvas.dispose()
        set({ fabricCanvas: null })
      }
    },
  }))
)