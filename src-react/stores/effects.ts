import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface EffectPreset {
  id: string
  name: string
  effects: Array<{
    type: string
    params: Record<string, any>
  }>
}

export interface EffectHistory {
  id: string
  effectType: string
  params: Record<string, any>
  timestamp: number
  objectId?: string
}

interface EffectsStore {
  // 当前效果状态
  activeEffect: string | null
  effectParams: Record<string, any>
  isProcessing: boolean
  processingProgress: number
  
  // 预设和历史
  presets: EffectPreset[]
  effectHistory: EffectHistory[]
  
  // 预览状态
  previewMode: boolean
  previewUrl: string | null
  
  // 操作方法
  setActiveEffect: (effect: string | null) => void
  updateEffectParams: (params: Record<string, any>) => void
  setProcessing: (processing: boolean, progress?: number) => void
  
  // 预设管理
  savePreset: (name: string) => void
  loadPreset: (presetId: string) => void
  deletePreset: (presetId: string) => void
  
  // 历史管理
  addToHistory: (effectType: string, params: Record<string, any>, objectId?: string) => void
  clearHistory: () => void
  
  // 预览管理
  setPreviewMode: (enabled: boolean) => void
  setPreviewUrl: (url: string | null) => void
  
  // 重置
  resetEffectParams: () => void
  resetAll: () => void
}

export const useEffectsStore = create<EffectsStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    activeEffect: null,
    effectParams: {},
    isProcessing: false,
    processingProgress: 0,
    presets: [
      {
        id: 'vintage-warm',
        name: '温暖复古',
        effects: [
          { type: 'sepia', params: {} },
          { type: 'brightness', params: { value: 10 } },
          { type: 'contrast', params: { value: 15 } }
        ]
      },
      {
        id: 'cool-blue',
        name: '冷色调',
        effects: [
          { type: 'hue-rotate', params: { angle: 200 } },
          { type: 'saturate', params: { value: 20 } },
          { type: 'contrast', params: { value: 10 } }
        ]
      },
      {
        id: 'dramatic-bw',
        name: '戏剧黑白',
        effects: [
          { type: 'grayscale', params: {} },
          { type: 'contrast', params: { value: 30 } },
          { type: 'brightness', params: { value: -5 } }
        ]
      }
    ],
    effectHistory: [],
    previewMode: false,
    previewUrl: null,

    // 操作方法
    setActiveEffect: (effect) => {
      set({ activeEffect: effect })
      if (!effect) {
        set({ effectParams: {} })
      }
    },

    updateEffectParams: (params) => {
      set((state) => ({
        effectParams: { ...state.effectParams, ...params }
      }))
    },

    setProcessing: (processing, progress = 0) => {
      set({ isProcessing: processing, processingProgress: progress })
    },

    // 预设管理
    savePreset: (name) => {
      const { activeEffect, effectParams } = get()
      if (!activeEffect) return

      const newPreset: EffectPreset = {
        id: Date.now().toString(),
        name,
        effects: [{ type: activeEffect, params: effectParams }]
      }

      set((state) => ({
        presets: [...state.presets, newPreset]
      }))
    },

    loadPreset: (presetId) => {
      const { presets } = get()
      const preset = presets.find(p => p.id === presetId)
      if (!preset || preset.effects.length === 0) return

      const firstEffect = preset.effects[0]
      set({
        activeEffect: firstEffect.type,
        effectParams: firstEffect.params
      })
    },

    deletePreset: (presetId) => {
      set((state) => ({
        presets: state.presets.filter(p => p.id !== presetId)
      }))
    },

    // 历史管理
    addToHistory: (effectType, params, objectId) => {
      const newHistoryItem: EffectHistory = {
        id: Date.now().toString(),
        effectType,
        params,
        timestamp: Date.now(),
        objectId
      }

      set((state) => ({
        effectHistory: [newHistoryItem, ...state.effectHistory].slice(0, 50) // 限制50条
      }))
    },

    clearHistory: () => {
      set({ effectHistory: [] })
    },

    // 预览管理
    setPreviewMode: (enabled) => {
      set({ previewMode: enabled })
      if (!enabled) {
        set({ previewUrl: null })
      }
    },

    setPreviewUrl: (url) => {
      set({ previewUrl: url })
    },

    // 重置
    resetEffectParams: () => {
      set({ effectParams: {} })
    },

    resetAll: () => {
      set({
        activeEffect: null,
        effectParams: {},
        previewMode: false,
        previewUrl: null
      })
    }
  }))
)