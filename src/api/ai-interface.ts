/**
 * AI驱动图像编辑接口
 * 为LLM大模型提供标准化的图像编辑API
 */

import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'
import { useToolStore } from '@/stores/tools'
import { useHistoryStore } from '@/stores/history'
import type { ToolType, Layer, ToolSettings } from '@/types'
import * as fabric from 'fabric'

// AI操作结果类型
export interface AIOperationResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// AI命令类型
export interface AICommand {
  action: string
  parameters: Record<string, any>
  description?: string
}

/**
 * AI图像编辑接口类
 * 提供给LLM调用的标准化API
 */
export class AIImageEditor {
  private static instance: AIImageEditor
  
  public static getInstance(): AIImageEditor {
    if (!AIImageEditor.instance) {
      AIImageEditor.instance = new AIImageEditor()
    }
    return AIImageEditor.instance
  }

  // ==================== 画布操作 ====================
  
  /**
   * 设置画布尺寸
   */
  async setCanvasSize(width: number, height: number): Promise<AIOperationResult> {
    try {
      const { setDimensions } = useCanvasStore.getState()
      setDimensions(width, height)
      
      return {
        success: true,
        message: `画布尺寸已设置为 ${width}x${height}`,
        data: { width, height }
      }
    } catch (error) {
      return {
        success: false,
        message: '设置画布尺寸失败',
        error: String(error)
      }
    }
  }

  /**
   * 设置画布背景色
   */
  async setBackgroundColor(color: string): Promise<AIOperationResult> {
    try {
      const { setBackgroundColor } = useCanvasStore.getState()
      setBackgroundColor(color)
      
      return {
        success: true,
        message: `背景色已设置为 ${color}`,
        data: { backgroundColor: color }
      }
    } catch (error) {
      return {
        success: false,
        message: '设置背景色失败',
        error: String(error)
      }
    }
  }

  // ==================== 图层操作 ====================
  
  /**
   * 创建新图层
   */
  async createLayer(name: string, type: 'raster' | 'vector' | 'text' = 'raster'): Promise<AIOperationResult> {
    try {
      const { addLayer } = useLayerStore.getState()
      const layerId = addLayer({
        name,
        visible: true,
        opacity: 100,
        locked: false,
        type
      })
      
      return {
        success: true,
        message: `图层 "${name}" 创建成功`,
        data: { layerId, name, type }
      }
    } catch (error) {
      return {
        success: false,
        message: '创建图层失败',
        error: String(error)
      }
    }
  }

  /**
   * 删除图层
   */
  async deleteLayer(layerId: string): Promise<AIOperationResult> {
    try {
      const { removeLayer, getLayerById } = useLayerStore.getState()
      const layer = getLayerById(layerId)
      
      if (!layer) {
        return {
          success: false,
          message: '图层不存在',
          error: 'Layer not found'
        }
      }
      
      removeLayer(layerId)
      
      return {
        success: true,
        message: `图层 "${layer.name}" 已删除`,
        data: { layerId }
      }
    } catch (error) {
      return {
        success: false,
        message: '删除图层失败',
        error: String(error)
      }
    }
  }

  /**
   * 设置图层透明度
   */
  async setLayerOpacity(layerId: string, opacity: number): Promise<AIOperationResult> {
    try {
      const { setLayerOpacity, getLayerById } = useLayerStore.getState()
      const layer = getLayerById(layerId)
      
      if (!layer) {
        return {
          success: false,
          message: '图层不存在',
          error: 'Layer not found'
        }
      }
      
      setLayerOpacity(layerId, opacity)
      
      return {
        success: true,
        message: `图层 "${layer.name}" 透明度已设置为 ${opacity}%`,
        data: { layerId, opacity }
      }
    } catch (error) {
      return {
        success: false,
        message: '设置图层透明度失败',
        error: String(error)
      }
    }
  }

  // ==================== 绘图工具操作 ====================
  
  /**
   * 切换工具
   */
  async switchTool(toolType: ToolType): Promise<AIOperationResult> {
    try {
      const { setActiveTool } = useToolStore.getState()
      setActiveTool(toolType)
      
      return {
        success: true,
        message: `已切换到 ${toolType} 工具`,
        data: { activeTool: toolType }
      }
    } catch (error) {
      return {
        success: false,
        message: '切换工具失败',
        error: String(error)
      }
    }
  }

  /**
   * 设置工具参数
   */
  async setToolSettings(toolType: ToolType, settings: Partial<ToolSettings>): Promise<AIOperationResult> {
    try {
      const { updateToolSettings } = useToolStore.getState()
      updateToolSettings(toolType, settings)
      
      return {
        success: true,
        message: `${toolType} 工具参数已更新`,
        data: { toolType, settings }
      }
    } catch (error) {
      return {
        success: false,
        message: '设置工具参数失败',
        error: String(error)
      }
    }
  }

  // ==================== 形状绘制 ====================
  
  /**
   * 绘制矩形
   */
  async drawRectangle(x: number, y: number, width: number, height: number, options?: {
    fill?: string
    stroke?: string
    strokeWidth?: number
  }): Promise<AIOperationResult> {
    try {
      const { fabricCanvas } = useCanvasStore.getState()
      if (!fabricCanvas) {
        return {
          success: false,
          message: '画布未初始化',
          error: 'Canvas not initialized'
        }
      }

      const rect = new fabric.Rect({
        left: x,
        top: y,
        width,
        height,
        fill: options?.fill || 'transparent',
        stroke: options?.stroke || '#000000',
        strokeWidth: options?.strokeWidth || 2,
      })

      fabricCanvas.add(rect)
      fabricCanvas.renderAll()

      return {
        success: true,
        message: `矩形已绘制在 (${x}, ${y})，尺寸 ${width}x${height}`,
        data: { x, y, width, height, objectId: rect.get('id') || 'rect_' + Date.now() }
      }
    } catch (error) {
      return {
        success: false,
        message: '绘制矩形失败',
        error: String(error)
      }
    }
  }

  /**
   * 绘制圆形
   */
  async drawCircle(x: number, y: number, radius: number, options?: {
    fill?: string
    stroke?: string
    strokeWidth?: number
  }): Promise<AIOperationResult> {
    try {
      const { fabricCanvas } = useCanvasStore.getState()
      if (!fabricCanvas) {
        return {
          success: false,
          message: '画布未初始化',
          error: 'Canvas not initialized'
        }
      }

      const circle = new fabric.Circle({
        left: x - radius,
        top: y - radius,
        radius,
        fill: options?.fill || 'transparent',
        stroke: options?.stroke || '#000000',
        strokeWidth: options?.strokeWidth || 2,
      })

      fabricCanvas.add(circle)
      fabricCanvas.renderAll()

      return {
        success: true,
        message: `圆形已绘制在 (${x}, ${y})，半径 ${radius}`,
        data: { x, y, radius, objectId: circle.get('id') || 'circle_' + Date.now() }
      }
    } catch (error) {
      return {
        success: false,
        message: '绘制圆形失败',
        error: String(error)
      }
    }
  }

  /**
   * 添加文本
   */
  async addText(text: string, x: number, y: number, options?: {
    fontSize?: number
    fontFamily?: string
    fill?: string
    fontWeight?: string
  }): Promise<AIOperationResult> {
    try {
      const { fabricCanvas } = useCanvasStore.getState()
      if (!fabricCanvas) {
        return {
          success: false,
          message: '画布未初始化',
          error: 'Canvas not initialized'
        }
      }

      const textObject = new fabric.Text(text, {
        left: x,
        top: y,
        fontSize: options?.fontSize || 16,
        fontFamily: options?.fontFamily || 'Arial',
        fill: options?.fill || '#000000',
        fontWeight: options?.fontWeight || 'normal',
      })

      fabricCanvas.add(textObject)
      fabricCanvas.renderAll()

      return {
        success: true,
        message: `文本 "${text}" 已添加到 (${x}, ${y})`,
        data: { text, x, y, objectId: textObject.get('id') || 'text_' + Date.now() }
      }
    } catch (error) {
      return {
        success: false,
        message: '添加文本失败',
        error: String(error)
      }
    }
  }

  // ==================== 图像操作 ====================
  
  /**
   * 加载图像
   */
  async loadImage(imageUrl: string, x: number = 0, y: number = 0): Promise<AIOperationResult> {
    try {
      const { fabricCanvas } = useCanvasStore.getState()
      if (!fabricCanvas) {
        return {
          success: false,
          message: '画布未初始化',
          error: 'Canvas not initialized'
        }
      }

      return new Promise((resolve) => {
        fabric.Image.fromURL(imageUrl, {
          crossOrigin: 'anonymous'
        }).then((img) => {
          if (!img) {
            resolve({
              success: false,
              message: '加载图像失败',
              error: 'Failed to load image'
            })
            return
          }

          img.set({
            left: x,
            top: y,
          })

          fabricCanvas.add(img)
          fabricCanvas.renderAll()

          resolve({
            success: true,
            message: `图像已加载到 (${x}, ${y})`,
            data: { imageUrl, x, y, objectId: img.get('id') || 'image_' + Date.now() }
          })
        }).catch(() => {
          resolve({
            success: false,
            message: '加载图像失败',
            error: 'Failed to load image from URL'
          })
        })
      })
    } catch (error) {
      return {
        success: false,
        message: '加载图像失败',
        error: String(error)
      }
    }
  }

  // ==================== 历史记录操作 ====================
  
  /**
   * 撤销操作
   */
  async undo(): Promise<AIOperationResult> {
    try {
      const { undo, canUndo } = useHistoryStore.getState()
      
      if (!canUndo()) {
        return {
          success: false,
          message: '没有可撤销的操作',
          error: 'No operations to undo'
        }
      }
      
      undo()
      
      return {
        success: true,
        message: '已撤销上一步操作',
        data: {}
      }
    } catch (error) {
      return {
        success: false,
        message: '撤销操作失败',
        error: String(error)
      }
    }
  }

  /**
   * 重做操作
   */
  async redo(): Promise<AIOperationResult> {
    try {
      const { redo, canRedo } = useHistoryStore.getState()
      
      if (!canRedo()) {
        return {
          success: false,
          message: '没有可重做的操作',
          error: 'No operations to redo'
        }
      }
      
      redo()
      
      return {
        success: true,
        message: '已重做操作',
        data: {}
      }
    } catch (error) {
      return {
        success: false,
        message: '重做操作失败',
        error: String(error)
      }
    }
  }

  // ==================== 状态查询 ====================
  
  /**
   * 获取画布状态
   */
  async getCanvasState(): Promise<AIOperationResult> {
    try {
      const { width, height, zoom, backgroundColor } = useCanvasStore.getState()
      
      return {
        success: true,
        message: '画布状态获取成功',
        data: {
          width,
          height,
          zoom,
          backgroundColor
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '获取画布状态失败',
        error: String(error)
      }
    }
  }

  /**
   * 获取图层列表
   */
  async getLayerList(): Promise<AIOperationResult> {
    try {
      const { layers, activeLayerId } = useLayerStore.getState()
      
      return {
        success: true,
        message: '图层列表获取成功',
        data: {
          layers: layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            locked: layer.locked,
            type: layer.type
          })),
          activeLayerId
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '获取图层列表失败',
        error: String(error)
      }
    }
  }

  /**
   * 导出画布为图像
   */
  async exportCanvas(format: 'png' | 'jpg' | 'webp' = 'png', quality: number = 1): Promise<AIOperationResult> {
    try {
      const { fabricCanvas } = useCanvasStore.getState()
      if (!fabricCanvas) {
        return {
          success: false,
          message: '画布未初始化',
          error: 'Canvas not initialized'
        }
      }

      const dataURL = fabricCanvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : format,
        quality,
        multiplier: 1
      })

      return {
        success: true,
        message: `画布已导出为 ${format.toUpperCase()} 格式`,
        data: {
          dataURL,
          format,
          quality
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '导出画布失败',
        error: String(error)
      }
    }
  }
}

// 导出单例实例
export const aiImageEditor = AIImageEditor.getInstance()

// 为LLM提供的简化接口
export const AI_COMMANDS = {
  // 画布操作
  SET_CANVAS_SIZE: 'setCanvasSize',
  SET_BACKGROUND_COLOR: 'setBackgroundColor',
  
  // 图层操作
  CREATE_LAYER: 'createLayer',
  DELETE_LAYER: 'deleteLayer',
  SET_LAYER_OPACITY: 'setLayerOpacity',
  
  // 工具操作
  SWITCH_TOOL: 'switchTool',
  SET_TOOL_SETTINGS: 'setToolSettings',
  
  // 绘图操作
  DRAW_RECTANGLE: 'drawRectangle',
  DRAW_CIRCLE: 'drawCircle',
  ADD_TEXT: 'addText',
  LOAD_IMAGE: 'loadImage',
  
  // 历史操作
  UNDO: 'undo',
  REDO: 'redo',
  
  // 状态查询
  GET_CANVAS_STATE: 'getCanvasState',
  GET_LAYER_LIST: 'getLayerList',
  EXPORT_CANVAS: 'exportCanvas'
}