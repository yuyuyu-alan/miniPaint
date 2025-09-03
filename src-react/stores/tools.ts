import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ToolType, ToolSettings } from '@/types'

interface ToolStore {
  activeTool: ToolType
  toolSettings: Record<ToolType, ToolSettings>
  
  // 工具历史记录
  recentTools: ToolType[]
  
  // 工具操作
  setActiveTool: (tool: ToolType) => void
  updateToolSettings: (tool: ToolType, settings: Partial<ToolSettings>) => void
  resetToolSettings: (tool: ToolType) => void
  resetAllToolSettings: () => void
  
  // 获取工具配置
  getToolSettings: (tool: ToolType) => ToolSettings
  getActiveToolSettings: () => ToolSettings
  
  // 工具快捷键
  getToolByShortcut: (key: string) => ToolType | null
}

// 默认工具设置
const defaultToolSettings: Record<ToolType, ToolSettings> = {
  select: {
    multiSelect: false,
    snapToGrid: true,
  },
  brush: {
    brushSize: 5,
    brushColor: '#000000',
    brushOpacity: 100,
  },
  rectangle: {
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
  },
  circle: {
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    textAlign: 'left',
    strokeColor: '#000000',
    fillColor: '#000000',
  },
  line: {
    strokeColor: '#000000',
    strokeWidth: 2,
  },
  crop: {
    aspectRatio: 'free',
    showGrid: true,
    preserveAspectRatio: false,
    cropMode: 'replace',
  },
  fill: {
    fillColor: '#000000',
    tolerance: 10,
  },
  erase: {
    brushSize: 20,
    opacity: 100,
  },
  clone: {
    brushSize: 20,
    opacity: 100,
    offset: { x: 0, y: 0 },
  },
  pick_color: {
    sampleSize: 1,
  },
  pen: {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    smoothing: 0.5,
    showControlPoints: true,
    snapToGrid: false,
  },
}

// 工具快捷键映射
const toolShortcuts: Record<string, ToolType> = {
  'KeyV': 'select',
  'KeyB': 'brush',
  'KeyR': 'rectangle',
  'KeyC': 'circle',
  'KeyT': 'text',
  'KeyL': 'line',
  'KeyK': 'crop',
  'KeyG': 'fill',
  'KeyE': 'erase',
  'KeyS': 'clone',
  'KeyI': 'pick_color',
  'KeyP': 'pen',
}

export const useToolStore = create<ToolStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    activeTool: 'select' as ToolType,
    toolSettings: { ...defaultToolSettings },
    recentTools: ['select', 'brush', 'rectangle'],

    // 工具操作
    setActiveTool: (tool) => {
      const { recentTools } = get()
      
      // 更新最近使用的工具
      const newRecentTools = [tool, ...recentTools.filter(t => t !== tool)].slice(0, 5)
      
      set({ 
        activeTool: tool,
        recentTools: newRecentTools 
      })
    },

    updateToolSettings: (tool, settings) => {
      set((state) => ({
        toolSettings: {
          ...state.toolSettings,
          [tool]: {
            ...state.toolSettings[tool],
            ...settings,
          },
        },
      }))
    },

    resetToolSettings: (tool) => {
      set((state) => ({
        toolSettings: {
          ...state.toolSettings,
          [tool]: { ...defaultToolSettings[tool] },
        },
      }))
    },
    
    resetAllToolSettings: () => {
      set({
        toolSettings: { ...defaultToolSettings },
      })
    },

    // 获取工具配置
    getToolSettings: (tool) => {
      const { toolSettings } = get()
      return toolSettings[tool] || {}
    },

    getActiveToolSettings: () => {
      const { activeTool, toolSettings } = get()
      return toolSettings[activeTool] || {}
    },
    
    // 根据快捷键获取工具
    getToolByShortcut: (key) => {
      return toolShortcuts[key] || null
    },
  }))
)