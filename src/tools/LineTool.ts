import * as fabric from 'fabric'
import type { ToolSettings } from '@/types'

/**
 * 直线工具状态
 */
interface LineToolState {
  mode: 'idle' | 'waiting_for_end'
  startPoint: fabric.Point | null
  previewLine: fabric.Line | null
  isActive: boolean
}

/**
 * 直线工具类 - 实现点击式绘制模式
 */
export class LineTool {
  private canvas: fabric.Canvas | null = null
  private state: LineToolState = {
    mode: 'idle',
    startPoint: null,
    previewLine: null,
    isActive: false,
  }
  
  private settings: ToolSettings = {
    strokeColor: '#000000',
    strokeWidth: 2,
  }

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  /**
   * 激活直线工具
   */
  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.state.isActive = true
    this.settings = { ...this.settings, ...settings }
    this.canvas.defaultCursor = 'crosshair'
    this.canvas.selection = false
    
    // 禁用对象交互，避免鼠标进入拖动模式
    this.canvas.getObjects().forEach(obj => {
      (obj as any).selectable = false
      ;(obj as any).evented = false
    })
    
    this.setupEventListeners()
    this.showInstructions()
    this.resetState()
  }

  /**
   * 停用直线工具
   */
  deactivate() {
    if (!this.canvas) return

    this.state.isActive = false
    this.canvas.defaultCursor = 'default'
    this.canvas.selection = true
    
    // 恢复对象交互
    this.canvas.getObjects().forEach(obj => {
      (obj as any).selectable = true
      ;(obj as any).evented = true
    })
    
    this.removeEventListeners()
    this.clearPreview()
    this.resetState()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    if (!this.canvas) return

    this.canvas.on('mouse:down', this.onMouseDown)
    this.canvas.on('mouse:move', this.onMouseMove)
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners() {
    if (!this.canvas) return

    this.canvas.off('mouse:down', this.onMouseDown)
    this.canvas.off('mouse:move', this.onMouseMove)
  }

  /**
   * 鼠标按下事件处理
   */
  private onMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    // 防止事件冒泡
    const evt = e.e as MouseEvent
    evt.preventDefault?.()
    evt.stopPropagation?.()

    const pointer = this.canvas.getPointer(e.e)

    switch (this.state.mode) {
      case 'idle':
        // 设置起点
        this.setStartPoint(pointer)
        break
        
      case 'waiting_for_end':
        // 设置终点并完成直线
        this.finishLine(pointer)
        break
    }
  }

  /**
   * 鼠标移动事件处理
   */
  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e || this.state.mode !== 'waiting_for_end') return

    const pointer = this.canvas.getPointer(e.e)
    this.updatePreview(pointer)
  }

  /**
   * 设置起点
   */
  private setStartPoint(point: fabric.Point) {
    this.state.startPoint = new fabric.Point(point.x, point.y)
    this.state.mode = 'waiting_for_end'
    
    // 创建预览线
    this.createPreviewLine(point)
    
    console.log('直线起点已设置，请点击设置终点')
  }

  /**
   * 创建预览线
   */
  private createPreviewLine(startPoint: fabric.Point) {
    if (!this.canvas) return

    this.state.previewLine = new fabric.Line(
      [startPoint.x, startPoint.y, startPoint.x, startPoint.y],
      {
        stroke: this.settings.strokeColor || '#007bff',
        strokeWidth: this.settings.strokeWidth || 2,
        strokeDashArray: [5, 5], // 虚线预览
        selectable: false,
        evented: false,
        opacity: 0.7,
      }
    )

    this.canvas.add(this.state.previewLine)
    this.canvas.renderAll()
  }

  /**
   * 更新预览线
   */
  private updatePreview(endPoint: fabric.Point) {
    if (!this.canvas || !this.state.previewLine || !this.state.startPoint) return

    this.state.previewLine.set({
      x2: endPoint.x,
      y2: endPoint.y,
    })

    this.canvas.renderAll()
  }

  /**
   * 完成直线绘制
   */
  private finishLine(endPoint: fabric.Point) {
    if (!this.canvas || !this.state.startPoint) return

    // 清除预览线
    this.clearPreview()

    // 创建最终直线
    const finalLine = new fabric.Line(
      [this.state.startPoint.x, this.state.startPoint.y, endPoint.x, endPoint.y],
      {
        stroke: this.settings.strokeColor || '#000000',
        strokeWidth: this.settings.strokeWidth || 2,
        selectable: false, // 绘制完成后不自动选中，避免进入拖动模式
        evented: false,    // 暂时禁用事件，避免立即进入拖动模式
      }
    )

    this.canvas.add(finalLine)
    
    // 延迟启用对象交互，避免立即进入拖动模式
    setTimeout(() => {
      if (finalLine && this.canvas) {
        (finalLine as any).selectable = true
        ;(finalLine as any).evented = true
        this.canvas.renderAll()
      }
    }, 100)

    this.canvas.renderAll()
    
    // 重置状态，准备绘制下一条直线
    this.resetState()
    
    console.log('直线绘制完成')
  }

  /**
   * 清除预览线
   */
  private clearPreview() {
    if (!this.canvas || !this.state.previewLine) return

    this.canvas.remove(this.state.previewLine)
    this.state.previewLine = null
    this.canvas.renderAll()
  }

  /**
   * 重置状态
   */
  private resetState() {
    this.state.mode = 'idle'
    this.state.startPoint = null
    this.clearPreview()
  }

  /**
   * 显示使用说明
   */
  private showInstructions() {
    console.log('直线工具已激活 - 点击设置起点，再次点击设置终点')
  }

  /**
   * 获取当前设置
   */
  getSettings(): ToolSettings {
    return { ...this.settings }
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<ToolSettings>) {
    this.settings = { ...this.settings, ...settings }
    
    // 如果有预览线，更新其样式
    if (this.state.previewLine) {
      this.state.previewLine.set({
        stroke: this.settings.strokeColor || '#007bff',
        strokeWidth: this.settings.strokeWidth || 2,
      })
      this.canvas?.renderAll()
    }
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      mode: this.state.mode,
      hasStartPoint: !!this.state.startPoint,
      isActive: this.state.isActive,
    }
  }

  /**
   * 取消当前绘制
   */
  cancelCurrentLine() {
    if (this.state.mode === 'waiting_for_end') {
      this.clearPreview()
      this.resetState()
      console.log('直线绘制已取消')
    }
  }
}