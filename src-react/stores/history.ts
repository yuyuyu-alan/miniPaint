import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as fabric from 'fabric'
import type { Layer } from '@/types'

interface HistoryState {
  canvasState: any
  layerStates: Layer[]
  timestamp: number
  description?: string
}

interface HistoryStore {
  // 历史记录状态
  history: HistoryState[]
  currentIndex: number
  maxHistorySize: number
  
  // 控制标志
  isUndoRedoing: boolean
  
  // 操作方法
  saveState: (description?: string) => void
  undo: () => boolean
  redo: () => boolean
  clearHistory: () => void
  
  // 状态查询
  canUndo: () => boolean
  canRedo: () => boolean
  getHistorySize: () => number
  
  // 批量操作
  startBatch: () => void
  endBatch: (description?: string) => void
  isBatching: boolean
  
  // 内部方法
  setUndoRedoing: (value: boolean) => void
}

export const useHistoryStore = create<HistoryStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    history: [],
    currentIndex: -1,
    maxHistorySize: 50,
    isUndoRedoing: false,
    isBatching: false,

    // 保存当前状态
    saveState: (description = '操作') => {
      const { history, currentIndex, maxHistorySize, isUndoRedoing, isBatching } = get()
      
      // 如果正在撤销/重做或批量操作中，不保存状态
      if (isUndoRedoing || isBatching) return
      
      // 获取当前 canvas 和 layers 状态
      const { fabricCanvas } = (window as any).__canvasStore || {}
      const { layers } = (window as any).__layerStore || {}
      
      if (!fabricCanvas) return
      
      const newState: HistoryState = {
        canvasState: fabricCanvas.toJSON(['id', 'selectable', 'evented']),
        layerStates: JSON.parse(JSON.stringify(layers || [])),
        timestamp: Date.now(),
        description
      }
      
      // 删除当前索引之后的所有历史记录（因为我们正在创建新分支）
      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(newState)
      
      // 限制历史记录大小
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
      }
      
      set({
        history: newHistory,
        currentIndex: newHistory.length - 1
      })
    },

    // 撤销操作
    undo: () => {
      const { history, currentIndex, canUndo } = get()
      
      if (!canUndo()) return false
      
      const targetIndex = currentIndex - 1
      const targetState = history[targetIndex]
      
      if (!targetState) return false
      
      // 设置撤销标志
      set({ isUndoRedoing: true, currentIndex: targetIndex })
      
      // 恢复状态
      restoreState(targetState)
      
      // 清除撤销标志
      set({ isUndoRedoing: false })
      
      return true
    },

    // 重做操作
    redo: () => {
      const { history, currentIndex, canRedo } = get()
      
      if (!canRedo()) return false
      
      const targetIndex = currentIndex + 1
      const targetState = history[targetIndex]
      
      if (!targetState) return false
      
      // 设置重做标志
      set({ isUndoRedoing: true, currentIndex: targetIndex })
      
      // 恢复状态
      restoreState(targetState)
      
      // 清除重做标志
      set({ isUndoRedoing: false })
      
      return true
    },

    // 清空历史记录
    clearHistory: () => {
      set({
        history: [],
        currentIndex: -1
      })
    },

    // 检查是否可以撤销
    canUndo: () => {
      const { currentIndex } = get()
      return currentIndex > 0
    },

    // 检查是否可以重做
    canRedo: () => {
      const { history, currentIndex } = get()
      return currentIndex < history.length - 1
    },

    // 获取历史记录大小
    getHistorySize: () => {
      const { history } = get()
      return history.length
    },

    // 开始批量操作
    startBatch: () => {
      set({ isBatching: true })
    },

    // 结束批量操作
    endBatch: (description = '批量操作') => {
      set({ isBatching: false })
      get().saveState(description)
    },

    // 设置撤销重做标志
    setUndoRedoing: (value) => {
      set({ isUndoRedoing: value })
    }
  }))
)

// 恢复状态的辅助函数
const restoreState = (state: HistoryState) => {
  const { fabricCanvas } = (window as any).__canvasStore || {}
  const { setLayers } = (window as any).__layerStore || {}
  
  if (!fabricCanvas) return
  
  // 恢复 canvas 状态
  fabricCanvas.loadFromJSON(state.canvasState, () => {
    fabricCanvas?.renderAll()
  })
  
  // 恢复图层状态
  if (setLayers) {
    setLayers(state.layerStates)
  }
  
  console.log(`恢复状态: ${state.description} (${new Date(state.timestamp).toLocaleTimeString()})`)
}