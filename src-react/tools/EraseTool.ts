import * as fabric from 'fabric'
import type { ToolType, ToolSettings } from '@/types'

export class EraseTool {
  private canvas: fabric.Canvas | null = null
  private isActive = false
  private isErasing = false
  private erasePath: fabric.Path | null = null
  private pathData: string[] = []

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.canvas.isDrawingMode = false
    this.canvas.selection = false
    this.canvas.defaultCursor = 'crosshair'
    
    this.setupEventListeners()
  }

  deactivate() {
    if (!this.canvas) return

    this.isActive = false
    this.canvas.isDrawingMode = false
    this.canvas.selection = true
    this.canvas.defaultCursor = 'default'
    
    this.removeEventListeners()
    this.finishErasing()
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

    this.isErasing = true
    const pointer = this.canvas.getPointer(e.e)
    
    // 开始新的擦除路径
    this.pathData = [`M ${pointer.x} ${pointer.y}`]
    this.startErasing(pointer)
  }

  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.isErasing || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    
    // 添加到路径数据
    this.pathData.push(`L ${pointer.x} ${pointer.y}`)
    
    // 更新擦除路径
    this.updateErasePath(pointer)
    
    // 执行擦除操作
    this.performErase(pointer)
  }

  private onMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.isErasing) return

    this.isErasing = false
    this.finishErasing()
  }

  private startErasing(pointer: fabric.Point) {
    if (!this.canvas) return

    const settings = this.getSettings()
    const brushSize = settings.brushSize || 20

    // 创建擦除路径的可视化
    this.erasePath = new fabric.Path(this.pathData.join(' '), {
      fill: 'transparent',
      stroke: 'rgba(255, 0, 0, 0.3)',
      strokeWidth: brushSize,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      selectable: false,
      evented: false,
    })

    this.canvas.add(this.erasePath)
    this.canvas.renderAll()
  }

  private updateErasePath(pointer: fabric.Point) {
    if (!this.canvas || !this.erasePath) return

    const pathString = this.pathData.join(' ')
    // 重新创建路径对象而不是直接修改path属性
    this.canvas.remove(this.erasePath)
    
    const settings = this.getSettings()
    const brushSize = settings.brushSize || 20
    
    this.erasePath = new fabric.Path(pathString, {
      fill: 'transparent',
      stroke: 'rgba(255, 0, 0, 0.3)',
      strokeWidth: brushSize,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      selectable: false,
      evented: false,
    })
    
    this.canvas.add(this.erasePath)
    this.canvas.renderAll()
  }

  private performErase(pointer: fabric.Point) {
    if (!this.canvas) return

    const settings = this.getSettings()
    const brushSize = settings.brushSize || 20
    const opacity = (settings.opacity || 100) / 100

    // 获取擦除区域内的对象
    const objectsToErase = this.canvas.getObjects().filter((obj) => {
      if (obj === this.erasePath) return false
      return this.isObjectInEraseArea(obj, pointer, brushSize)
    })

    // 对每个对象执行擦除操作
    objectsToErase.forEach((obj) => {
      this.eraseFromObject(obj, pointer, brushSize, opacity)
    })

    this.canvas.renderAll()
  }

  private isObjectInEraseArea(obj: fabric.Object, pointer: fabric.Point, brushSize: number): boolean {
    const objBounds = obj.getBoundingRect()
    const distance = Math.sqrt(
      Math.pow(pointer.x - (objBounds.left + objBounds.width / 2), 2) +
      Math.pow(pointer.y - (objBounds.top + objBounds.height / 2), 2)
    )
    
    return distance <= brushSize / 2 + Math.max(objBounds.width, objBounds.height) / 2
  }

  private eraseFromObject(obj: fabric.Object, pointer: fabric.Point, brushSize: number, opacity: number) {
    if (obj instanceof fabric.Path) {
      // 对于路径对象，减少透明度或删除
      const currentOpacity = obj.opacity || 1
      const newOpacity = Math.max(0, currentOpacity - opacity * 0.1)
      
      if (newOpacity <= 0.1) {
        this.canvas?.remove(obj)
      } else {
        obj.set('opacity', newOpacity)
      }
    } else if (obj instanceof fabric.Image) {
      // 对于图像对象，使用遮罩擦除
      this.eraseFromImage(obj, pointer, brushSize)
    } else {
      // 对于其他对象，减少透明度或删除
      const currentOpacity = obj.opacity || 1
      const newOpacity = Math.max(0, currentOpacity - opacity * 0.1)
      
      if (newOpacity <= 0.1) {
        this.canvas?.remove(obj)
      } else {
        obj.set('opacity', newOpacity)
      }
    }
  }

  private eraseFromImage(imageObj: fabric.Image, pointer: fabric.Point, brushSize: number) {
    // 这里可以实现更复杂的图像擦除逻辑
    // 例如使用 Canvas 2D API 在图像上创建透明区域
    
    // 简化版本：直接减少透明度
    const currentOpacity = imageObj.opacity || 1
    const newOpacity = Math.max(0, currentOpacity - 0.1)
    
    if (newOpacity <= 0.1) {
      this.canvas?.remove(imageObj)
    } else {
      imageObj.set('opacity', newOpacity)
    }
  }

  private finishErasing() {
    if (this.canvas && this.erasePath) {
      this.canvas.remove(this.erasePath)
      this.erasePath = null
      this.pathData = []
      this.canvas.renderAll()
    }
  }

  getSettings(): ToolSettings {
    return {
      brushSize: 20,
      opacity: 100,
    }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    // 更新橡皮擦工具设置
  }
}