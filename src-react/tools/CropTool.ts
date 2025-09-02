import * as fabric from 'fabric'
import type { ToolType, ToolSettings } from '@/types'

export class CropTool {
  private canvas: fabric.Canvas | null = null
  private cropRect: fabric.Rect | null = null
  private isActive = false
  private startPoint: fabric.Point | null = null

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.canvas.selection = false
    this.canvas.defaultCursor = 'crosshair'
    
    // 禁用对象选择
    this.canvas.forEachObject((obj) => {
      obj.selectable = false
      obj.evented = false
    })

    this.setupEventListeners()
  }

  deactivate() {
    if (!this.canvas) return

    this.isActive = false
    this.canvas.selection = true
    this.canvas.defaultCursor = 'default'
    
    // 恢复对象选择
    this.canvas.forEachObject((obj) => {
      obj.selectable = true
      obj.evented = true
    })

    this.removeCropRect()
    this.removeEventListeners()
  }

  private setupEventListeners() {
    if (!this.canvas) return

    this.canvas.on('mouse:down', this.onMouseDown)
    this.canvas.on('mouse:move', this.onMouseMove)
    this.canvas.on('mouse:up', this.onMouseUp)
  }

  private removeEventListeners() {
    if (!this.canvas) return

    this.canvas.off('mouse:down', this.onMouseDown)
    this.canvas.off('mouse:move', this.onMouseMove)
    this.canvas.off('mouse:up', this.onMouseUp)
  }

  private onMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    this.startPoint = new fabric.Point(pointer.x, pointer.y)

    // 创建裁剪矩形
    this.cropRect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    })

    this.canvas.add(this.cropRect)
    this.canvas.renderAll()
  }

  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.cropRect || !this.startPoint || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    const width = Math.abs(pointer.x - this.startPoint.x)
    const height = Math.abs(pointer.y - this.startPoint.y)
    const left = Math.min(this.startPoint.x, pointer.x)
    const top = Math.min(this.startPoint.y, pointer.y)

    this.cropRect.set({
      left,
      top,
      width,
      height,
    })

    this.canvas.renderAll()
  }

  private onMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.cropRect || !this.startPoint) return

    const pointer = this.canvas.getPointer(e.e)
    const width = Math.abs(pointer.x - this.startPoint.x)
    const height = Math.abs(pointer.y - this.startPoint.y)

    // 如果裁剪区域太小，取消裁剪
    if (width < 10 || height < 10) {
      this.removeCropRect()
      return
    }

    // 执行裁剪
    this.performCrop()
  }

  private performCrop() {
    if (!this.canvas || !this.cropRect) return

    const cropArea = {
      left: this.cropRect.left || 0,
      top: this.cropRect.top || 0,
      width: this.cropRect.width || 0,
      height: this.cropRect.height || 0,
    }

    // 获取裁剪区域内的对象
    const objectsInCrop = this.canvas.getObjects().filter((obj) => {
      if (obj === this.cropRect) return false
      
      const objBounds = obj.getBoundingRect()
      return (
        objBounds.left >= cropArea.left &&
        objBounds.top >= cropArea.top &&
        objBounds.left + objBounds.width <= cropArea.left + cropArea.width &&
        objBounds.top + objBounds.height <= cropArea.top + cropArea.height
      )
    })

    // 移除不在裁剪区域内的对象
    const objectsToRemove = this.canvas.getObjects().filter((obj) => {
      return obj !== this.cropRect && !objectsInCrop.includes(obj)
    })

    objectsToRemove.forEach((obj) => {
      this.canvas?.remove(obj)
    })

    // 调整画布尺寸
    this.canvas.setDimensions({
      width: cropArea.width,
      height: cropArea.height,
    })

    // 调整对象位置
    objectsInCrop.forEach((obj) => {
      obj.set({
        left: (obj.left || 0) - cropArea.left,
        top: (obj.top || 0) - cropArea.top,
      })
    })

    this.removeCropRect()
    this.canvas.renderAll()
  }

  private removeCropRect() {
    if (this.canvas && this.cropRect) {
      this.canvas.remove(this.cropRect)
      this.cropRect = null
      this.canvas.renderAll()
    }
  }

  getSettings(): ToolSettings {
    return {
      aspectRatio: 'free',
      showGrid: true,
    }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    // 更新裁剪工具设置
  }
}