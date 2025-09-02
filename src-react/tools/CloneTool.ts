import * as fabric from 'fabric'
import type { ToolType, ToolSettings } from '@/types'

export class CloneTool {
  private canvas: fabric.Canvas | null = null
  private isActive = false
  private sourcePoint: fabric.Point | null = null
  private targetPoint: fabric.Point | null = null
  private isCloning = false
  private sourceSet = false
  private clonePreview: fabric.Circle | null = null

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.canvas.defaultCursor = 'crosshair'
    this.canvas.selection = false
    this.sourceSet = false
    
    this.setupEventListeners()
    this.showInstructions()
  }

  deactivate() {
    if (!this.canvas) return

    this.isActive = false
    this.canvas.defaultCursor = 'default'
    this.canvas.selection = true
    
    this.removeEventListeners()
    this.clearPreview()
    this.resetState()
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

    if (!this.sourceSet) {
      // 第一次点击：设置源点
      this.sourcePoint = new fabric.Point(pointer.x, pointer.y)
      this.sourceSet = true
      this.showSourceMarker()
      this.canvas.defaultCursor = 'copy'
    } else {
      // 第二次点击：开始克隆
      this.targetPoint = new fabric.Point(pointer.x, pointer.y)
      this.isCloning = true
    }
  }

  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    const pointer = this.canvas.getPointer(e.e)

    if (this.sourceSet && !this.isCloning) {
      // 显示克隆预览
      this.showClonePreview(pointer)
    } else if (this.isCloning && this.sourcePoint && this.targetPoint) {
      // 执行克隆操作
      this.performClone(pointer)
    }
  }

  private onMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.isCloning) return

    this.isCloning = false
  }

  private showInstructions() {
    // 可以在这里显示使用说明
    console.log('克隆工具：先点击源区域，再点击目标区域开始克隆')
  }

  private showSourceMarker() {
    if (!this.canvas || !this.sourcePoint) return

    this.clearPreview()

    // 创建源点标记
    const marker = new fabric.Circle({
      left: this.sourcePoint.x - 5,
      top: this.sourcePoint.y - 5,
      radius: 5,
      fill: 'transparent',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
    })

    this.canvas.add(marker)
    this.clonePreview = marker
    this.canvas.renderAll()
  }

  private showClonePreview(pointer: fabric.Point) {
    if (!this.canvas || !this.sourcePoint) return

    this.clearPreview()

    const settings = this.getSettings()
    const brushSize = settings.brushSize || 20

    // 创建预览圆圈
    const preview = new fabric.Circle({
      left: pointer.x - brushSize / 2,
      top: pointer.y - brushSize / 2,
      radius: brushSize / 2,
      fill: 'transparent',
      stroke: 'rgba(0, 123, 255, 0.5)',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })

    this.canvas.add(preview)
    this.clonePreview = preview
    this.canvas.renderAll()
  }

  private performClone(pointer: fabric.Point) {
    if (!this.canvas || !this.sourcePoint) return

    const settings = this.getSettings()
    const brushSize = settings.brushSize || 20
    const opacity = (settings.opacity || 100) / 100

    // 计算偏移量
    const offset = settings.offset || { x: 0, y: 0 }
    const sourceX = this.sourcePoint.x + offset.x
    const sourceY = this.sourcePoint.y + offset.y

    // 获取源区域的图像数据
    const sourceImageData = this.getImageDataFromArea(sourceX, sourceY, brushSize)
    if (!sourceImageData) return

    // 将图像数据克隆到目标位置
    this.cloneImageDataToArea(pointer.x, pointer.y, sourceImageData, opacity)
  }

  private getImageDataFromArea(x: number, y: number, size: number): ImageData | null {
    if (!this.canvas) return null

    try {
      // 获取画布的底层canvas元素
      const canvasElement = this.canvas.getElement()
      const ctx = canvasElement.getContext('2d')
      if (!ctx) return null

      // 确保坐标在画布范围内
      const clampedX = Math.max(0, Math.min(x - size / 2, canvasElement.width - size))
      const clampedY = Math.max(0, Math.min(y - size / 2, canvasElement.height - size))
      const clampedSize = Math.min(size, canvasElement.width - clampedX, canvasElement.height - clampedY)

      return ctx.getImageData(clampedX, clampedY, clampedSize, clampedSize)
    } catch (error) {
      console.error('获取图像数据失败:', error)
      return null
    }
  }

  private cloneImageDataToArea(x: number, y: number, imageData: ImageData, opacity: number) {
    if (!this.canvas) return

    try {
      // 创建临时canvas来处理图像数据
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      // 将图像数据绘制到临时canvas
      tempCtx.putImageData(imageData, 0, 0)

      // 创建fabric图像对象
      const img = new fabric.Image(tempCanvas, {
        left: x - imageData.width / 2,
        top: y - imageData.height / 2,
        opacity: opacity,
        selectable: false,
        evented: false,
      })

      this.canvas.add(img)
      this.canvas.renderAll()
    } catch (error) {
      console.error('克隆图像数据失败:', error)
    }
  }

  private clearPreview() {
    if (this.canvas && this.clonePreview) {
      this.canvas.remove(this.clonePreview)
      this.clonePreview = null
      this.canvas.renderAll()
    }
  }

  private resetState() {
    this.sourcePoint = null
    this.targetPoint = null
    this.sourceSet = false
    this.isCloning = false
    this.clearPreview()
  }

  // 重置源点（按Escape键或右键点击时调用）
  resetSource() {
    this.resetState()
    if (this.canvas) {
      this.canvas.defaultCursor = 'crosshair'
    }
    this.showInstructions()
  }

  getSettings(): ToolSettings {
    return {
      brushSize: 20,
      opacity: 100,
      offset: { x: 0, y: 0 },
    }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    // 更新克隆工具设置
  }
}