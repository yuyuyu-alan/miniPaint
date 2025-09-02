import * as fabric from 'fabric'
import type { ToolType, ToolSettings } from '@/types'

export class FillTool {
  private canvas: fabric.Canvas | null = null
  private isActive = false

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.canvas.defaultCursor = 'crosshair'
    this.canvas.selection = false
    
    this.setupEventListeners()
  }

  deactivate() {
    if (!this.canvas) return

    this.isActive = false
    this.canvas.defaultCursor = 'default'
    this.canvas.selection = true
    
    this.removeEventListeners()
  }

  private setupEventListeners() {
    if (!this.canvas) return

    this.canvas.on('mouse:down', this.onMouseDown)
  }

  private removeEventListeners() {
    if (!this.canvas) return

    this.canvas.off('mouse:down', this.onMouseDown)
  }

  private onMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    const target = this.canvas.findTarget(e.e)

    if (target) {
      // 如果点击了对象，填充该对象
      this.fillObject(target)
    } else {
      // 如果点击了空白区域，填充背景
      this.fillBackground()
    }
  }

  private fillObject(target: fabric.Object) {
    if (!target) return

    const settings = this.getSettings()
    const fillColor = settings.fillColor || '#000000'

    // 根据对象类型进行填充
    if (target instanceof fabric.Path) {
      // 对于路径对象（如画笔绘制的路径）
      target.set('fill', fillColor)
    } else if (target instanceof fabric.Rect || 
               target instanceof fabric.Circle || 
               target instanceof fabric.Triangle ||
               target instanceof fabric.Polygon) {
      // 对于形状对象
      target.set('fill', fillColor)
    } else if (target instanceof fabric.Text) {
      // 对于文本对象
      target.set('fill', fillColor)
    } else if (target instanceof fabric.Group) {
      // 对于组合对象，递归填充
      target.forEachObject((obj) => {
        this.fillObject(obj)
      })
    }

    this.canvas?.renderAll()
  }

  private fillBackground() {
    if (!this.canvas) return

    const settings = this.getSettings()
    const fillColor = settings.fillColor || '#ffffff'

    this.canvas.backgroundColor = fillColor
    this.canvas.renderAll()
  }

  // 智能填充 - 基于颜色相似度的区域填充
  private floodFill(x: number, y: number, targetColor: string, tolerance: number = 10) {
    if (!this.canvas) return

    // 获取画布的图像数据
    const canvasElement = this.canvas.getElement()
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height)
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // 获取起始点的颜色
    const startIndex = (y * width + x) * 4
    const startR = data[startIndex]
    const startG = data[startIndex + 1]
    const startB = data[startIndex + 2]
    const startA = data[startIndex + 3]

    // 解析目标颜色
    const targetRGB = this.hexToRgb(targetColor)
    if (!targetRGB) return

    // 如果起始颜色和目标颜色相同，不需要填充
    if (this.colorsMatch(
      { r: startR, g: startG, b: startB, a: startA },
      { r: targetRGB.r, g: targetRGB.g, b: targetRGB.b, a: 255 },
      tolerance
    )) {
      return
    }

    // 使用栈进行洪水填充算法
    const stack: Array<{ x: number; y: number }> = [{ x, y }]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const { x: currentX, y: currentY } = stack.pop()!
      const key = `${currentX},${currentY}`

      if (visited.has(key) || 
          currentX < 0 || currentX >= width || 
          currentY < 0 || currentY >= height) {
        continue
      }

      visited.add(key)

      const currentIndex = (currentY * width + currentX) * 4
      const currentR = data[currentIndex]
      const currentG = data[currentIndex + 1]
      const currentB = data[currentIndex + 2]
      const currentA = data[currentIndex + 3]

      // 检查当前像素是否与起始颜色匹配
      if (!this.colorsMatch(
        { r: currentR, g: currentG, b: currentB, a: currentA },
        { r: startR, g: startG, b: startB, a: startA },
        tolerance
      )) {
        continue
      }

      // 填充当前像素
      data[currentIndex] = targetRGB.r
      data[currentIndex + 1] = targetRGB.g
      data[currentIndex + 2] = targetRGB.b
      data[currentIndex + 3] = 255

      // 添加相邻像素到栈中
      stack.push(
        { x: currentX + 1, y: currentY },
        { x: currentX - 1, y: currentY },
        { x: currentX, y: currentY + 1 },
        { x: currentX, y: currentY - 1 }
      )
    }

    // 将修改后的图像数据绘制回画布
    ctx.putImageData(imageData, 0, 0)
    this.canvas.renderAll()
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private colorsMatch(
    color1: { r: number; g: number; b: number; a: number },
    color2: { r: number; g: number; b: number; a: number },
    tolerance: number
  ): boolean {
    return Math.abs(color1.r - color2.r) <= tolerance &&
           Math.abs(color1.g - color2.g) <= tolerance &&
           Math.abs(color1.b - color2.b) <= tolerance &&
           Math.abs(color1.a - color2.a) <= tolerance
  }

  getSettings(): ToolSettings {
    return {
      fillColor: '#000000',
      tolerance: 10,
    }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    // 更新填充工具设置
  }
}