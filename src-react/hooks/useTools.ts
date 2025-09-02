import { useCallback, useEffect, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useToolStore } from '@/stores/tools'
import { useUIStore } from '@/stores/ui'
import type { ToolType } from '@/types'
import * as fabric from 'fabric'
import { CropTool } from '@/tools/CropTool'
import { FillTool } from '@/tools/FillTool'
import { EraseTool } from '@/tools/EraseTool'
import { CloneTool } from '@/tools/CloneTool'

export const useTools = () => {
  const { fabricCanvas } = useCanvasStore()
  const {
    activeTool,
    toolSettings,
    setActiveTool,
    updateToolSettings,
    getActiveToolSettings,
    getToolByShortcut
  } = useToolStore()
  const { colors } = useUIStore()

  // 工具实例引用
  const toolInstances = useRef<{
    crop?: CropTool
    fill?: FillTool
    erase?: EraseTool
    clone?: CloneTool
  }>({})

  // 取消当前工具
  const deactivateCurrentTool = useCallback(() => {
    if (!fabricCanvas) return

    // 取消所有自定义工具
    Object.values(toolInstances.current).forEach(tool => {
      if (tool && typeof tool.deactivate === 'function') {
        try {
          tool.deactivate()
        } catch (error) {
          console.warn('Error deactivating tool:', error)
        }
      }
    })

    // 重置 canvas 状态
    fabricCanvas.isDrawingMode = false
    fabricCanvas.selection = true
    fabricCanvas.defaultCursor = 'default'
    
    // 移除画笔
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush = null as any
    }
  }, [fabricCanvas])

  // 配置工具对应的 Canvas 行为
  const configureToolForCanvas = useCallback((tool: ToolType, canvas: fabric.Canvas) => {
    const settings = getActiveToolSettings()

    switch (tool) {
      case 'select':
        canvas.isDrawingMode = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
        break

      case 'brush':
        canvas.isDrawingMode = true
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        // 配置画笔
        const brush = new fabric.PencilBrush(canvas)
        brush.width = settings.brushSize || 5
        brush.color = settings.brushColor || colors.primary
        
        canvas.freeDrawingBrush = brush
        break

      case 'rectangle':
      case 'circle':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        break

      case 'text':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'text'
        break

      case 'line':
      case 'arrow':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        break

      case 'crop':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        // 确保先取消其他工具
        Object.entries(toolInstances.current).forEach(([key, tool]) => {
          if (key !== 'crop' && tool && typeof tool.deactivate === 'function') {
            tool.deactivate()
          }
        })
        
        // 初始化裁剪工具
        if (!toolInstances.current.crop) {
          toolInstances.current.crop = new CropTool(canvas)
        }
        toolInstances.current.crop.activate(settings)
        break

      case 'fill':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        // 确保先取消其他工具
        Object.entries(toolInstances.current).forEach(([key, tool]) => {
          if (key !== 'fill' && tool && typeof tool.deactivate === 'function') {
            tool.deactivate()
          }
        })
        
        // 初始化填充工具
        if (!toolInstances.current.fill) {
          toolInstances.current.fill = new FillTool(canvas)
        }
        toolInstances.current.fill.activate(settings)
        break

      case 'erase':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        // 确保先取消其他工具
        Object.entries(toolInstances.current).forEach(([key, tool]) => {
          if (key !== 'erase' && tool && typeof tool.deactivate === 'function') {
            tool.deactivate()
          }
        })
        
        // 初始化橡皮擦工具
        if (!toolInstances.current.erase) {
          toolInstances.current.erase = new EraseTool(canvas)
        }
        toolInstances.current.erase.activate(settings)
        break

      case 'clone':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        // 确保先取消其他工具
        Object.entries(toolInstances.current).forEach(([key, tool]) => {
          if (key !== 'clone' && tool && typeof tool.deactivate === 'function') {
            tool.deactivate()
          }
        })
        
        // 初始化克隆工具
        if (!toolInstances.current.clone) {
          toolInstances.current.clone = new CloneTool(canvas)
        }
        toolInstances.current.clone.activate(settings)
        break

      case 'pick_color':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        break

      default:
        canvas.isDrawingMode = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
    }

    canvas.renderAll()
  }, [getActiveToolSettings, colors.primary])

  // 激活工具
  const activateTool = useCallback((tool: ToolType) => {
    if (!fabricCanvas) return

    // 取消当前工具状态
    deactivateCurrentTool()
    
    // 设置新工具
    setActiveTool(tool)
    
    // 配置新工具
    configureToolForCanvas(tool, fabricCanvas)
  }, [fabricCanvas, setActiveTool, deactivateCurrentTool, configureToolForCanvas])

  // 监听键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tool = getToolByShortcut(e.code)
      if (tool) {
        e.preventDefault()
        activateTool(tool)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [getToolByShortcut, activateTool])

  // 监听颜色变化，更新当前工具配置
  useEffect(() => {
    if (!fabricCanvas || !activeTool) return

    // 如果当前是画笔工具，需要重新配置画笔颜色
    if (activeTool === 'brush' && fabricCanvas.isDrawingMode) {
      const settings = getActiveToolSettings()
      const brush = new fabric.PencilBrush(fabricCanvas)
      brush.width = settings.brushSize || 5
      brush.color = settings.brushColor || colors.primary
      fabricCanvas.freeDrawingBrush = brush
    }
  }, [fabricCanvas, activeTool, colors.primary, getActiveToolSettings])

  // 创建形状
  const createShape = useCallback((type: 'rectangle' | 'circle', startPoint: fabric.Point, endPoint: fabric.Point) => {
    if (!fabricCanvas) return

    const settings = getActiveToolSettings()
    const width = Math.abs(endPoint.x - startPoint.x)
    const height = Math.abs(endPoint.y - startPoint.y)
    const left = Math.min(startPoint.x, endPoint.x)
    const top = Math.min(startPoint.y, endPoint.y)

    let shape: fabric.Object

    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: settings.fillColor === 'transparent' ? 'transparent' : settings.fillColor,
        stroke: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
      })
    } else {
      const radius = Math.min(width, height) / 2
      shape = new fabric.Circle({
        left: left + radius,
        top: top + radius,
        radius,
        fill: settings.fillColor === 'transparent' ? 'transparent' : settings.fillColor,
        stroke: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        originX: 'center',
        originY: 'center',
      })
    }

    fabricCanvas.add(shape)
    fabricCanvas.setActiveObject(shape)
    fabricCanvas.renderAll()
  }, [fabricCanvas, getActiveToolSettings])

  // 创建文本
  const createText = useCallback((point: fabric.Point, text: string = '输入文本') => {
    if (!fabricCanvas) return

    const settings = getActiveToolSettings()
    
    const textObject = new fabric.IText(text, {
      left: point.x,
      top: point.y,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontWeight: settings.fontWeight,
      textAlign: settings.textAlign,
      fill: settings.fillColor || colors.primary,
      stroke: settings.strokeColor,
    })

    fabricCanvas.add(textObject)
    fabricCanvas.setActiveObject(textObject)
    textObject.enterEditing()
    fabricCanvas.renderAll()
  }, [fabricCanvas, getActiveToolSettings, colors.primary])

  // 创建直线
  const createLine = useCallback((startPoint: fabric.Point, endPoint: fabric.Point) => {
    if (!fabricCanvas) return

    const settings = getActiveToolSettings()
    
    const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
    })

    fabricCanvas.add(line)
    fabricCanvas.setActiveObject(line)
    fabricCanvas.renderAll()
  }, [fabricCanvas, getActiveToolSettings])

  return {
    activeTool,
    toolSettings,
    activateTool,
    updateToolSettings,
    getActiveToolSettings,
    createShape,
    createText,
    createLine,
    deactivateCurrentTool,
  }
}

// 工具图标映射
export const getToolIcon = (tool: ToolType): string => {
  const iconMap: Record<ToolType, string> = {
    select: 'mouse-pointer',
    brush: 'brush',
    rectangle: 'square',
    circle: 'circle',
    text: 'type',
    line: 'minus',
    arrow: 'arrow-up-right',
    crop: 'crop',
    fill: 'paint-bucket',
    erase: 'eraser',
    clone: 'copy',
    pick_color: 'pipette',
  }
  return iconMap[tool] || 'help-circle'
}

// 工具名称映射
export const getToolName = (tool: ToolType): string => {
  const nameMap: Record<ToolType, string> = {
    select: '选择',
    brush: '画笔',
    rectangle: '矩形',
    circle: '圆形',
    text: '文本',
    line: '直线',
    arrow: '箭头',
    crop: '裁剪',
    fill: '填充',
    erase: '橡皮擦',
    clone: '仿制',
    pick_color: '吸色器',
  }
  return nameMap[tool] || tool
}