import { useCallback, useEffect } from 'react'
import * as fabric from 'fabric'
import { useToolStore } from '@/stores/tools'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType, ToolSettings } from '@/types'

export const useTool = (toolType?: ToolType) => {
  const {
    activeTool,
    toolSettings,
    setActiveTool,
    updateToolSettings,
    getToolSettings,
    getActiveToolSettings,
  } = useToolStore()

  const { fabricCanvas } = useCanvasStore()

  const currentTool = toolType || activeTool
  const isActive = activeTool === currentTool
  const settings = getToolSettings(currentTool)

  // 激活工具
  const activate = useCallback(() => {
    if (toolType) {
      setActiveTool(toolType)
    }
  }, [toolType, setActiveTool])

  // 更新工具设置
  const updateSettings = useCallback(
    (newSettings: Partial<ToolSettings>) => {
      updateToolSettings(currentTool, newSettings)
    },
    [currentTool, updateToolSettings]
  )

  // 应用工具到画布
  const applyToCanvas = useCallback(
    (canvas: fabric.Canvas) => {
      if (!canvas) return

      // 重置画布状态
      canvas.isDrawingMode = false
      canvas.selection = true
      canvas.defaultCursor = 'default'

      switch (currentTool) {
        case 'select':
          canvas.selection = true
          canvas.defaultCursor = 'default'
          break

        case 'brush':
          canvas.isDrawingMode = true
          const brush = new fabric.PencilBrush(canvas)
          brush.width = settings.brushSize || 5
          brush.color = settings.brushColor || '#000000'
          canvas.freeDrawingBrush = brush
          canvas.defaultCursor = 'crosshair'
          break

        case 'rectangle':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          break

        case 'circle':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          break

        case 'text':
          canvas.selection = false
          canvas.defaultCursor = 'text'
          break

        case 'line':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          break

        case 'fill':
          canvas.selection = false
          canvas.defaultCursor = 'copy'
          break

        case 'erase':
          canvas.isDrawingMode = true
          const eraser = new fabric.EraserBrush(canvas)
          eraser.width = settings.brushSize || 20
          canvas.freeDrawingBrush = eraser
          canvas.defaultCursor = 'crosshair'
          break

        case 'pick_color':
          canvas.selection = false
          canvas.defaultCursor = 'copy'
          break

        default:
          canvas.selection = true
          canvas.defaultCursor = 'default'
      }

      canvas.renderAll()
    },
    [currentTool, settings]
  )

  // 工具特定的事件处理器
  const createToolEventHandlers = useCallback(() => {
    if (!fabricCanvas) return {}

    const handlers: Record<string, (...args: any[]) => void> = {}

    switch (currentTool) {
      case 'rectangle':
        handlers.mouseDown = (event: fabric.IEvent) => {
          const pointer = fabricCanvas.getPointer(event.e)
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: settings.fillColor || 'transparent',
            stroke: settings.strokeColor || '#000000',
            strokeWidth: settings.strokeWidth || 2,
          })
          fabricCanvas.add(rect)
          fabricCanvas.renderAll()
        }
        break

      case 'circle':
        handlers.mouseDown = (event: fabric.IEvent) => {
          const pointer = fabricCanvas.getPointer(event.e)
          const circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: settings.fillColor || 'transparent',
            stroke: settings.strokeColor || '#000000',
            strokeWidth: settings.strokeWidth || 2,
          })
          fabricCanvas.add(circle)
          fabricCanvas.renderAll()
        }
        break

      case 'text':
        handlers.mouseDown = (event: fabric.IEvent) => {
          const pointer = fabricCanvas.getPointer(event.e)
          const text = new fabric.IText('请输入文本', {
            left: pointer.x,
            top: pointer.y,
            fontSize: settings.fontSize || 16,
            fontFamily: settings.fontFamily || 'Arial',
            fill: settings.fillColor || '#000000',
          })
          fabricCanvas.add(text)
          fabricCanvas.setActiveObject(text)
          text.enterEditing()
          fabricCanvas.renderAll()
        }
        break

      case 'pick_color':
        handlers.mouseDown = (event: fabric.IEvent) => {
          const pointer = fabricCanvas.getPointer(event.e)
          // TODO: 实现颜色拾取功能
          console.log('Pick color at:', pointer)
        }
        break
    }

    return handlers
  }, [fabricCanvas, currentTool, settings])

  // 当工具或画布改变时应用到画布
  useEffect(() => {
    if (fabricCanvas && isActive) {
      applyToCanvas(fabricCanvas)
    }
  }, [fabricCanvas, isActive, applyToCanvas])

  // 绑定工具特定的事件处理器
  useEffect(() => {
    if (!fabricCanvas || !isActive) return

    const handlers = createToolEventHandlers()
    
    // 绑定事件
    Object.entries(handlers).forEach(([eventName, handler]) => {
      fabricCanvas.on(eventName as any, handler)
    })

    // 清理函数
    return () => {
      Object.entries(handlers).forEach(([eventName, handler]) => {
        fabricCanvas.off(eventName as any, handler)
      })
    }
  }, [fabricCanvas, isActive, createToolEventHandlers])

  return {
    isActive,
    settings,
    activate,
    updateSettings,
    applyToCanvas,
  }
}

// 专门的工具 Hook
export const useActiveTool = () => useTool()

export const useSelectTool = () => useTool('select')
export const useBrushTool = () => useTool('brush')
export const useRectangleTool = () => useTool('rectangle')
export const useCircleTool = () => useTool('circle')
export const useTextTool = () => useTool('text')
export const useLineTool = () => useTool('line')
export const useFillTool = () => useTool('fill')
export const useEraseTool = () => useTool('erase')
export const usePickColorTool = () => useTool('pick_color')