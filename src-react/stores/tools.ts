import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ToolType, ToolSettings } from '@/types'

interface ToolStore {
  activeTool: ToolType
  toolSettings: Record<ToolType, ToolSettings>
  
  // 工具操作
  setActiveTool: (tool: ToolType) => void
  updateToolSettings: (tool: ToolType, settings: Partial<ToolSettings>) => void
  resetToolSettings: (tool: ToolType) => void
  
  // 获取工具配置
  getToolSettings: (tool: ToolType) => ToolSettings
  getActiveToolSettings: () => ToolSettings
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
  arrow: {
    strokeColor: '#000000',
    strokeWidth: 2,
    arrowSize: 10,
  },
  crop: {
    aspectRatio: 'free',
    showGrid: true,
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
}

export const useToolStore = create<ToolStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    activeTool: 'select' as ToolType,
    toolSettings: { ...defaultToolSettings },

    // 工具操作
    setActiveTool: (tool) => {
      set({ activeTool: tool })
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

    // 获取工具配置
    getToolSettings: (tool) => {
      const { toolSettings } = get()
      return toolSettings[tool] || {}
    },

    getActiveToolSettings: () => {
      const { activeTool, toolSettings } = get()
      return toolSettings[activeTool] || {}
    },
  }))
)