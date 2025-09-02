import * as fabric from 'fabric'

// 工具类型枚举
export type ToolType = 
  | 'select'
  | 'brush' 
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'line'
  | 'arrow'
  | 'crop'
  | 'fill'
  | 'erase'
  | 'clone'
  | 'pick_color'

// 图层类型
export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  locked: boolean
  type: 'raster' | 'vector' | 'text'
  fabricObject?: fabric.Object
  thumbnail?: string
  blendMode?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

// 工具设置类型
export interface ToolSettings {
  [key: string]: any
  // 画笔设置
  brushSize?: number
  brushColor?: string
  brushOpacity?: number
  
  // 形状设置
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  
  // 文本设置
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  textAlign?: string
}

// Canvas 状态类型
export interface CanvasState {
  width: number
  height: number
  zoom: number
  offset: { x: number; y: number }
  backgroundColor: string
  fabricCanvas: fabric.Canvas | null
}

// 历史记录状态类型
export interface HistoryState {
  canvasState: any
  layerStates: Layer[]
  timestamp: number
  description?: string
}

// UI 状态类型
export interface UIState {
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean
  panelVisibility: {
    layers: boolean
    tools: boolean
    properties: boolean
    colors: boolean
  }
  modalOpen: string | null
}

// 颜色类型
export interface ColorState {
  primary: string
  secondary: string
  swatches: string[]
  recentColors: string[]
}

// 文件信息类型
export interface FileInfo {
  name: string
  type: string
  size: number
  lastModified: Date
  path?: string
}

// 效果参数类型
export interface EffectParams {
  [key: string]: number | string | boolean
}

// 导出选项类型
export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'svg'
  quality?: number
  width?: number
  height?: number
  transparent?: boolean
}