import * as fabric from 'fabric'
import type { ToolSettings, BezierPoint, BezierPath, PenToolState } from '@/types'

export class PenTool {
  private canvas: fabric.Canvas | null = null
  private isActive = false
  private state: PenToolState = {
    mode: 'idle',
    currentPath: null,
    selectedPoint: null,
    selectedPointIndex: -1,
    isDrawing: false,
    showPreview: false,
  }
  
  private settings: ToolSettings = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    smoothing: 0.5,
    showControlPoints: true,
    snapToGrid: false,
  }

  // 预览元素
  private previewPath: fabric.Path | null = null
  private controlPointsGroup: fabric.Group | null = null
  private anchorPoints: fabric.Circle[] = []
  private controlPoints: fabric.Circle[] = []
  private controlLines: fabric.Line[] = []
  
        // 键盘状态
        private isCommandPressed = false
        private isDragging = false
        private dragStartPoint: fabric.Point | null = null
        // 抑制下一次 mousedown（用于吞掉双击的第二下，避免新路径从闭合点开始）
        private suppressNextMouseDown = false
        // 路径刚刚完成/闭合的时间戳（用于忽略紧随其后的 mousedown）
        private lastFinalizeTs = 0
        // 防止重复闭合的标志
        private isClosing = false

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  activate(settings: ToolSettings = {}) {
    if (!this.canvas) return

    this.isActive = true
    this.settings = { ...this.settings, ...settings }
    this.canvas.defaultCursor = 'crosshair'
    this.canvas.selection = false
    
    this.setupEventListeners()
    this.showInstructions()
    this.state.mode = 'drawing'
  }

  deactivate() {
    if (!this.canvas) return

    this.isActive = false
    this.canvas.defaultCursor = 'default'
    this.canvas.selection = true
    
    this.removeEventListeners()
    this.clearPreview()
    this.finishCurrentPath()
    this.resetState()
  }

  private setupEventListeners() {
    if (!this.canvas) return

    this.canvas.on('mouse:down', this.onMouseDown)
    this.canvas.on('mouse:move', this.onMouseMove)
    this.canvas.on('mouse:up', this.onMouseUp)
    this.canvas.on('mouse:dblclick', this.onDoubleClick)
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  private removeEventListeners() {
    if (!this.canvas) return

    this.canvas.off('mouse:down', this.onMouseDown)
    this.canvas.off('mouse:move', this.onMouseMove)
    this.canvas.off('mouse:up', this.onMouseUp)
    this.canvas.off('mouse:dblclick', this.onDoubleClick)
    
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  private onMouseDown = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    // 防止事件冒泡影响到其它层的 mouse 处理器（如 CanvasArea），避免需要点击两次
    const evt = e.e as MouseEvent
    evt.preventDefault?.()
    evt.stopPropagation?.()

    // 刚刚完成/闭合后的短暂时间内忽略一次按下，避免新路径从相同点开始
    if (Date.now() - this.lastFinalizeTs < 400) {
      return
    }

    // 抑制双击的第二下，避免在闭合后立刻把同一点当作新路径起点
    if (this.suppressNextMouseDown) {
      this.suppressNextMouseDown = false
      return
    }

    const pointer = this.canvas.getPointer(e.e)
    
    switch (this.state.mode) {
      case 'drawing':
        this.handleDrawingMouseDown(pointer, evt)
        break
      case 'editing':
        this.handleEditingMouseDown(pointer)
        break
    }
  }

  private onMouseMove = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas || !e.e) return

    const pointer = this.canvas.getPointer(e.e)
    
    if (this.state.mode === 'drawing' && this.state.isDrawing && this.state.currentPath) {
      this.updateCurrentPoint(pointer)
      this.updatePreview()
    } else if (this.state.mode === 'editing' && this.isDragging && this.state.selectedPoint && this.state.currentPath) {
      // 在编辑模式下拖拽锚点或控制点
      this.updateSelectedPoint(pointer)
      this.updatePreview()
    }
  }

  private onMouseUp = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas) return

    // 只有在确实处于绘制状态时才处理 mouseup
    if (this.state.isDrawing) {
      this.state.isDrawing = false
    }
    
    this.isDragging = false
    this.dragStartPoint = null
  }

  private onDoubleClick = (e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!this.canvas) return

    if (this.state.mode === 'drawing' && this.state.currentPath) {
      this.finishCurrentPath()
      // 轻微抑制后续一次 mousedown，避免双击后误开新路径
      this.suppressNextMouseDown = true
      setTimeout(() => { this.suppressNextMouseDown = false }, 250)
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Meta' || e.key === 'Control') { // Command on Mac, Ctrl on Windows
      this.isCommandPressed = true
      if (this.state.currentPath) {
        this.state.mode = 'editing'
        this.updateControlPointsVisibility()
      }
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Meta' || e.key === 'Control') {
      this.isCommandPressed = false
      if (this.state.mode === 'editing') {
        this.state.mode = 'drawing'
        this.updateControlPointsVisibility()
      }
    }
  }

  private handleDrawingMouseDown(pointer: fabric.Point, evt?: MouseEvent) {
    if (!this.state.currentPath) {
      // 开始新路径
      this.startNewPath(pointer)
      this.state.isDrawing = true
    } else {
      // 检查是否点击了第一个点来闭合路径
      const firstPoint = this.state.currentPath.points[0]
      const distanceToFirst = this.getDistance(pointer, firstPoint)
      const zoom = this.canvas?.getZoom?.() ?? 1
      // 以屏幕像素为准的命中阈值（默认约 32px），随缩放自适应
      const closeThreshold = 32 / (zoom || 1)
      
      if (distanceToFirst <= closeThreshold && this.state.currentPath.points.length >= 3) {
        // 闭合路径 - 立即处理，不等待 mouseup
        this.closeCurrentPath()
        // 立即阻止事件传播，防止重复处理
        if (evt) {
          evt.stopImmediatePropagation?.()
          evt.preventDefault?.()
        }
        // 强制阻止后续的 mouseup 事件处理闭合逻辑
        this.state.isDrawing = false
        // 设置更长的抑制时间，确保不会意外开始新路径
        this.suppressNextMouseDown = true
        setTimeout(() => { this.suppressNextMouseDown = false }, 800)
        return
      }
      
      // 添加新点到当前路径
      this.addPointToPath(pointer)
      this.state.isDrawing = true
    }
  }

  private handleEditingMouseDown(pointer: fabric.Point) {
    // 检查是否点击了控制点或锚点
    const clickedPoint = this.getPointAtPosition(pointer)
    
    if (clickedPoint) {
      this.state.selectedPoint = clickedPoint.point
      this.state.selectedPointIndex = clickedPoint.index
      this.isDragging = true
      this.dragStartPoint = new fabric.Point(pointer.x, pointer.y)
    } else {
      this.state.selectedPoint = null
      this.state.selectedPointIndex = -1
      this.isDragging = false
      this.dragStartPoint = null
    }
    
    this.updateControlPointsVisibility()
  }

  private startNewPath(pointer: fabric.Point) {
    const newPath: BezierPath = {
      id: `path_${Date.now()}`,
      points: [],
      closed: false,
      strokeColor: this.settings.strokeColor || '#000000',
      strokeWidth: this.settings.strokeWidth || 2,
      fillColor: this.settings.fillColor === 'transparent' ? undefined : this.settings.fillColor,
      visible: true,
    }

    // 添加第一个锚点
    const firstPoint: BezierPoint = {
      x: pointer.x,
      y: pointer.y,
      type: 'anchor',
    }

    newPath.points.push(firstPoint)
    this.state.currentPath = newPath
    this.updatePreview()
  }

  private addPointToPath(pointer: fabric.Point) {
    if (!this.state.currentPath) return

    const newPoint: BezierPoint = {
      x: pointer.x,
      y: pointer.y,
      type: 'anchor',
    }

    this.state.currentPath.points.push(newPoint)
    this.updatePreview()
  }

  private updateCurrentPoint(pointer: fabric.Point) {
    if (!this.state.currentPath || this.state.currentPath.points.length === 0) return

    const lastPoint = this.state.currentPath.points[this.state.currentPath.points.length - 1]
    
    // 更新控制点以创建平滑的贝塞尔曲线
    if (!lastPoint.controlPoint2) {
      lastPoint.controlPoint2 = { x: pointer.x, y: pointer.y }
    } else {
      lastPoint.controlPoint2.x = pointer.x
      lastPoint.controlPoint2.y = pointer.y
    }

    // 如果有前一个点，也更新其控制点
    if (this.state.currentPath.points.length > 1) {
      const prevPoint = this.state.currentPath.points[this.state.currentPath.points.length - 2]
      if (!prevPoint.controlPoint1) {
        const dx = lastPoint.x - prevPoint.x
        const dy = lastPoint.y - prevPoint.y
        prevPoint.controlPoint1 = {
          x: prevPoint.x + dx * 0.3,
          y: prevPoint.y + dy * 0.3,
        }
      }
    }
  }

  private updateSelectedPoint(pointer: fabric.Point) {
    if (!this.state.currentPath || !this.state.selectedPoint || this.state.selectedPointIndex < 0) return

    const point = this.state.currentPath.points[this.state.selectedPointIndex]
    if (!point) return

    // 更新选中点的位置
    if (this.state.selectedPoint.type === 'anchor') {
      // 移动锚点
      const deltaX = pointer.x - point.x
      const deltaY = pointer.y - point.y
      
      point.x = pointer.x
      point.y = pointer.y
      
      // 同时移动控制点
      if (point.controlPoint1) {
        point.controlPoint1.x += deltaX
        point.controlPoint1.y += deltaY
      }
      if (point.controlPoint2) {
        point.controlPoint2.x += deltaX
        point.controlPoint2.y += deltaY
      }
    } else if (this.state.selectedPoint.type === 'control1' && point.controlPoint1) {
      // 移动控制点1
      point.controlPoint1.x = pointer.x
      point.controlPoint1.y = pointer.y
    } else if (this.state.selectedPoint.type === 'control2' && point.controlPoint2) {
      // 移动控制点2
      point.controlPoint2.x = pointer.x
      point.controlPoint2.y = pointer.y
    }
  }

  private updatePreview() {
    if (!this.canvas || !this.state.currentPath) return

    this.clearPreview()

    const pathString = this.generateSVGPath(this.state.currentPath)
    
    if (pathString) {
      this.previewPath = new fabric.Path(pathString, {
        fill: this.state.currentPath.fillColor || 'transparent',
        stroke: this.state.currentPath.strokeColor,
        strokeWidth: this.state.currentPath.strokeWidth,
        selectable: false,
        evented: false,
      })

      this.canvas.add(this.previewPath)
    }

    // 显示控制点
    if (this.settings.showControlPoints) {
      this.showControlPoints()
    }

    this.canvas.renderAll()
  }

  private generateSVGPath(path: BezierPath): string {
    if (path.points.length === 0) return ''

    let pathString = `M ${path.points[0].x} ${path.points[0].y}`

    for (let i = 1; i < path.points.length; i++) {
      const currentPoint = path.points[i]
      const prevPoint = path.points[i - 1]

      if (prevPoint.controlPoint1 && currentPoint.controlPoint2) {
        // 使用三次贝塞尔曲线
        pathString += ` C ${prevPoint.controlPoint1.x} ${prevPoint.controlPoint1.y}, ${currentPoint.controlPoint2.x} ${currentPoint.controlPoint2.y}, ${currentPoint.x} ${currentPoint.y}`
      } else {
        // 直线
        pathString += ` L ${currentPoint.x} ${currentPoint.y}`
      }
    }

    if (path.closed) {
      pathString += ' Z'
    }

    return pathString
  }

  private showControlPoints() {
    if (!this.canvas || !this.state.currentPath) return

    this.clearControlPoints()

    this.state.currentPath.points.forEach((point, index) => {
      // 锚点 - 第一个点在绘制模式下有特殊样式提示可以闭合
      const isFirstPoint = index === 0
      const canClose = this.state.mode === 'drawing' && this.state.currentPath!.points.length >= 3
      
      const anchorPoint = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: isFirstPoint && canClose ? 6 : 4,
        fill: isFirstPoint && canClose ? '#28a745' : '#007bff',
        stroke: '#ffffff',
        strokeWidth: isFirstPoint && canClose ? 3 : 2,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
        hoverCursor: 'crosshair',
        moveCursor: 'crosshair',
      })
      
      this.anchorPoints.push(anchorPoint)
      if (this.canvas) {
        this.canvas.add(anchorPoint)
      }

      // 控制点1
      if (point.controlPoint1) {
        const controlPoint1 = new fabric.Circle({
          left: point.controlPoint1.x,
          top: point.controlPoint1.y,
          radius: 3,
          fill: '#28a745',
          stroke: '#ffffff',
          strokeWidth: 1,
          selectable: this.state.mode === 'editing',
          evented: this.state.mode === 'editing',
          originX: 'center',
          originY: 'center',
        })

        const controlLine1 = new fabric.Line([
          point.x, point.y,
          point.controlPoint1.x, point.controlPoint1.y
        ], {
          stroke: '#28a745',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })

        this.controlPoints.push(controlPoint1)
        this.controlLines.push(controlLine1)
        if (this.canvas) {
          this.canvas.add(controlLine1)
          this.canvas.add(controlPoint1)
        }
      }

      // 控制点2
      if (point.controlPoint2) {
        const controlPoint2 = new fabric.Circle({
          left: point.controlPoint2.x,
          top: point.controlPoint2.y,
          radius: 3,
          fill: '#dc3545',
          stroke: '#ffffff',
          strokeWidth: 1,
          selectable: this.state.mode === 'editing',
          evented: this.state.mode === 'editing',
          originX: 'center',
          originY: 'center',
        })

        const controlLine2 = new fabric.Line([
          point.x, point.y,
          point.controlPoint2.x, point.controlPoint2.y
        ], {
          stroke: '#dc3545',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })

        this.controlPoints.push(controlPoint2)
        this.controlLines.push(controlLine2)
        if (this.canvas) {
          this.canvas.add(controlLine2)
          this.canvas.add(controlPoint2)
        }
      }
    })
  }

  private clearControlPoints() {
    if (!this.canvas) return

    [...this.anchorPoints, ...this.controlPoints, ...this.controlLines].forEach(obj => {
      this.canvas!.remove(obj)
    })

    this.anchorPoints = []
    this.controlPoints = []
    this.controlLines = []
  }

  private clearPreview() {
    if (!this.canvas) return

    if (this.previewPath) {
      this.canvas.remove(this.previewPath)
      this.previewPath = null
    }

    this.clearControlPoints()
  }

  private finishCurrentPath() {
    if (!this.canvas || !this.state.currentPath) return

    // 创建最终的路径对象
    const pathString = this.generateSVGPath(this.state.currentPath)
    
    if (pathString) {
      const finalPath = new fabric.Path(pathString, {
        fill: this.state.currentPath.fillColor || 'transparent',
        stroke: this.state.currentPath.strokeColor,
        strokeWidth: this.state.currentPath.strokeWidth,
        selectable: false,
        evented: false,
      })

      this.canvas.add(finalPath)
    }

    this.clearPreview()
    this.state.currentPath = null
    this.state.isDrawing = false
    this.state.mode = 'drawing'
    this.lastFinalizeTs = Date.now()
  }

  private closeCurrentPath() {
    if (!this.canvas || !this.state.currentPath || this.isClosing) return

    // 设置闭合标志，防止重复执行
    this.isClosing = true

    // 标记路径为闭合
    this.state.currentPath.closed = true
    
    // 先清理预览，避免重叠显示
    this.clearPreview()
    
    // 创建最终的闭合路径对象
    const pathString = this.generateSVGPath(this.state.currentPath)
    
    if (pathString) {
      const finalPath = new fabric.Path(pathString, {
        fill: this.state.currentPath.fillColor || 'transparent',
        stroke: this.state.currentPath.strokeColor,
        strokeWidth: this.state.currentPath.strokeWidth,
        selectable: false,
        evented: false,
      })

      this.canvas.add(finalPath)
      
      // 立即强制渲染画布，确保用户能看到闭合的路径
      this.canvas.renderAll()
    }

    // 清理状态，确保完全重置
    this.state.currentPath = null
    this.state.isDrawing = false
    this.state.mode = 'drawing'
    this.state.selectedPoint = null
    this.state.selectedPointIndex = -1
    
    // 设置完成时间戳，防止立即开始新路径
    this.lastFinalizeTs = Date.now()
    
    console.log('路径已闭合')

    // 延迟重置闭合标志，确保当前事件周期完成
    setTimeout(() => {
      this.isClosing = false
    }, 100)
  }

  private getPointAtPosition(pointer: fabric.Point): { point: BezierPoint; index: number } | null {
    if (!this.state.currentPath) return null

    const threshold = 8 // 点击检测阈值

    for (let i = 0; i < this.state.currentPath.points.length; i++) {
      const point = this.state.currentPath.points[i]
      
      // 检查控制点（优先级更高，因为它们更小更难点击）
      if (point.controlPoint1 && this.getDistance(pointer, point.controlPoint1) < threshold) {
        return {
          point: { ...point.controlPoint1, type: 'control1' } as BezierPoint,
          index: i
        }
      }

      if (point.controlPoint2 && this.getDistance(pointer, point.controlPoint2) < threshold) {
        return {
          point: { ...point.controlPoint2, type: 'control2' } as BezierPoint,
          index: i
        }
      }
      
      // 检查锚点
      if (this.getDistance(pointer, point) < threshold) {
        return {
          point: { ...point, type: 'anchor' } as BezierPoint,
          index: i
        }
      }
    }

    return null
  }

  private getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private updateControlPointsVisibility() {
    // 根据选中状态更新控制点显示
    this.showControlPoints()
  }

  private showInstructions() {
    console.log('钢笔工具已激活 - 点击创建锚点，拖拽调整贝塞尔曲线，双击完成路径')
  }

  private resetState() {
    this.state = {
      mode: 'idle',
      currentPath: null,
      selectedPoint: null,
      selectedPointIndex: -1,
      isDrawing: false,
      showPreview: false,
    }
  }

  // 公共方法
  getSettings(): ToolSettings {
    return { ...this.settings }
  }

  updateSettings(settings: Partial<ToolSettings>) {
    this.settings = { ...this.settings, ...settings }
  }

  getCurrentPath(): BezierPath | null {
    return this.state.currentPath
  }

  switchToEditMode() {
    if (this.state.currentPath) {
      this.state.mode = 'editing'
      this.updateControlPointsVisibility()
    }
  }

  switchToDrawMode() {
    this.state.mode = 'drawing'
    this.clearControlPoints()
  }
}