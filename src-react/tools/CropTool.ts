import * as fabric from 'fabric'
import type { ToolType, ToolSettings } from '@/types'

interface CropToolCallbacks {
  onCanvasResize?: (width: number, height: number) => void
  onCropComplete?: () => void
}

export class CropTool {
  private canvas: fabric.Canvas | null = null
  private cropRect: fabric.Rect | null = null
  private cropOverlay: fabric.Rect | null = null
  private previewRect: fabric.Rect | null = null
  private isActive = false
  private startPoint: fabric.Point | null = null
  private isDragging = false
  private settings: ToolSettings = {}
  private callbacks: CropToolCallbacks = {}

  constructor(canvas: fabric.Canvas, callbacks?: CropToolCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks || {}
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.settings = settings
    this.canvas.selection = false
    this.canvas.defaultCursor = 'crosshair'
    
    // 禁用对象选择
    this.canvas.forEachObject((obj) => {
      obj.selectable = false
      obj.evented = false
    })

    this.setupEventListeners()
    this.showCropInstructions()
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

    this.removeCropElements()
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

  private showCropInstructions() {
    // 可以在这里添加用户指导提示
    console.log('裁剪工具已激活：拖拽选择要保留的区域')
  }

  private onMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    this.startPoint = new fabric.Point(pointer.x, pointer.y)
    this.isDragging = true

    // 移除之前的裁剪元素
    this.removeCropElements()

    // 创建裁剪选择框
    this.cropRect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'rgba(0, 123, 255, 0.1)',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    })

    // 创建遮罩层显示裁剪预览
    this.createCropOverlay()

    this.canvas.add(this.cropRect)
    this.canvas.renderAll()
  }

  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.cropRect || !this.startPoint || !e.e || !this.isDragging) return

    const pointer = this.canvas.getPointer(e.e)
    const width = Math.abs(pointer.x - this.startPoint.x)
    const height = Math.abs(pointer.y - this.startPoint.y)
    const left = Math.min(this.startPoint.x, pointer.x)
    const top = Math.min(this.startPoint.y, pointer.y)

    // 限制裁剪区域在画布范围内
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()
    
    const clampedLeft = Math.max(0, Math.min(left, canvasWidth))
    const clampedTop = Math.max(0, Math.min(top, canvasHeight))
    const clampedWidth = Math.min(width, canvasWidth - clampedLeft)
    const clampedHeight = Math.min(height, canvasHeight - clampedTop)

    this.cropRect.set({
      left: clampedLeft,
      top: clampedTop,
      width: clampedWidth,
      height: clampedHeight,
    })

    // 更新遮罩层
    this.updateCropOverlay(clampedLeft, clampedTop, clampedWidth, clampedHeight)
    this.canvas.renderAll()
  }

  private onMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !this.cropRect || !this.startPoint) return

    this.isDragging = false
    const width = this.cropRect.width || 0
    const height = this.cropRect.height || 0

    // 如果裁剪区域太小，取消裁剪
    if (width < 20 || height < 20) {
      this.removeCropElements()
      console.log('裁剪区域太小，已取消裁剪')
      return
    }

    // 显示确认对话框或直接执行裁剪
    this.showCropConfirmation()
  }

  private createCropOverlay() {
    if (!this.canvas) return

    // 创建半透明遮罩，突出显示裁剪区域
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    this.cropOverlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: canvasHeight,
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
      excludeFromExport: true,
    })

    this.canvas.add(this.cropOverlay)
    this.canvas.sendObjectToBack(this.cropOverlay)
  }

  private updateCropOverlay(cropLeft: number, cropTop: number, cropWidth: number, cropHeight: number) {
    if (!this.canvas || !this.cropOverlay) return

    // 使用 clipPath 来创建裁剪区域的"洞"
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    // 创建一个复合路径，外部是整个画布，内部是裁剪区域（形成洞）
    const pathString = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z M ${cropLeft} ${cropTop} L ${cropLeft + cropWidth} ${cropTop} L ${cropLeft + cropWidth} ${cropTop + cropHeight} L ${cropLeft} ${cropTop + cropHeight} Z`
    
    const clipPath = new fabric.Path(pathString, {
      fillRule: 'evenodd',
    })

    this.cropOverlay.set({
      clipPath: clipPath
    })
  }

  private showCropConfirmation() {
    if (!this.canvas || !this.cropRect) return

    // 添加确认按钮或直接执行裁剪
    // 这里我们直接执行裁剪，也可以添加确认对话框
    setTimeout(() => {
      this.performCrop()
    }, 100)
  }

  private performCrop() {
    if (!this.canvas || !this.cropRect) return

    const cropArea = {
      left: this.cropRect.left || 0,
      top: this.cropRect.top || 0,
      width: this.cropRect.width || 0,
      height: this.cropRect.height || 0,
    }

    // 获取所有非裁剪相关的对象
    const allObjects = this.canvas.getObjects().filter(obj =>
      obj !== this.cropRect &&
      obj !== this.cropOverlay &&
      !obj.excludeFromExport
    )

    // 分类对象：完全在裁剪区域内的、部分重叠的、完全在外的
    const objectsInCrop: fabric.Object[] = []
    const objectsPartiallyInCrop: fabric.Object[] = []
    const objectsOutsideCrop: fabric.Object[] = []

    allObjects.forEach((obj) => {
      const objBounds = obj.getBoundingRect()
      
      // 检查对象是否与裁剪区域有交集
      const hasIntersection = !(
        objBounds.left + objBounds.width < cropArea.left ||
        objBounds.left > cropArea.left + cropArea.width ||
        objBounds.top + objBounds.height < cropArea.top ||
        objBounds.top > cropArea.top + cropArea.height
      )

      if (!hasIntersection) {
        objectsOutsideCrop.push(obj)
      } else {
        // 检查是否完全在裁剪区域内
        const fullyInside = (
          objBounds.left >= cropArea.left &&
          objBounds.top >= cropArea.top &&
          objBounds.left + objBounds.width <= cropArea.left + cropArea.width &&
          objBounds.top + objBounds.height <= cropArea.top + cropArea.height
        )

        if (fullyInside) {
          objectsInCrop.push(obj)
        } else {
          objectsPartiallyInCrop.push(obj)
        }
      }
    })

    // 移除完全在裁剪区域外的对象
    objectsOutsideCrop.forEach((obj) => {
      this.canvas?.remove(obj)
    })

    // 对于部分重叠的对象，可以选择保留或裁剪
    // 这里我们选择保留它们，但调整位置
    const objectsToKeep = [...objectsInCrop, ...objectsPartiallyInCrop]

    // 调整保留对象的位置
    objectsToKeep.forEach((obj) => {
      const currentLeft = obj.left || 0
      const currentTop = obj.top || 0
      
      obj.set({
        left: currentLeft - cropArea.left,
        top: currentTop - cropArea.top,
      })
      
      // 标记对象需要重新计算坐标
      obj.setCoords()
    })

    // 移除裁剪相关的辅助元素
    this.removeCropElements()

    // 调整画布尺寸 - 通过回调函数通知外部更新
    if (this.callbacks.onCanvasResize) {
      this.callbacks.onCanvasResize(cropArea.width, cropArea.height)
    } else {
      // 备用方案：直接设置画布尺寸
      this.canvas.setDimensions({
        width: cropArea.width,
        height: cropArea.height,
      })
    }
    
    // 重置视口变换
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])

    // 重新渲染画布
    this.canvas.renderAll()
    
    console.log(`裁剪完成：保留了 ${objectsToKeep.length} 个对象，移除了 ${objectsOutsideCrop.length} 个对象`)
    
    // 通知裁剪完成
    if (this.callbacks.onCropComplete) {
      this.callbacks.onCropComplete()
    }
    
    // 裁剪完成后自动切换回选择工具
    this.deactivate()
  }

  private removeCropElements() {
    if (this.canvas) {
      if (this.cropRect) {
        this.canvas.remove(this.cropRect)
        this.cropRect = null
      }
      if (this.cropOverlay) {
        this.canvas.remove(this.cropOverlay)
        this.cropOverlay = null
      }
      if (this.previewRect) {
        this.canvas.remove(this.previewRect)
        this.previewRect = null
      }
      this.canvas.renderAll()
    }
  }

  getSettings(): ToolSettings {
    return {
      aspectRatio: this.settings.aspectRatio || 'free',
      showGrid: this.settings.showGrid !== false,
      preserveAspectRatio: this.settings.preserveAspectRatio || false,
    }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    this.settings = { ...this.settings, ...settings }
    
    // 如果有活动的裁剪操作，更新显示
    if (this.cropRect && settings.showGrid !== undefined) {
      // 可以在这里更新网格显示
    }
  }
}