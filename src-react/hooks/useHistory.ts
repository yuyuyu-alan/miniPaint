import { useState, useCallback, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useLayerStore } from '@/stores/layers'
import type { HistoryState } from '@/types'

interface UseHistoryOptions {
  maxHistorySize?: number
  debounceMs?: number
}

export const useHistory = (options: UseHistoryOptions = {}) => {
  const { maxHistorySize = 50, debounceMs = 500 } = options
  
  const { fabricCanvas } = useCanvasStore()
  const { layers } = useLayerStore()
  
  const [history, setHistory] = useState<HistoryState[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // 保存当前状态到历史记录
  const saveState = useCallback((description?: string) => {
    if (!fabricCanvas) return

    // 清除之前的防抖定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // 使用防抖来避免过于频繁的历史记录保存
    debounceTimer.current = setTimeout(() => {
      const canvasState = fabricCanvas.toJSON([
        'id', 'selectable', 'evented', 'excludeFromExport'
      ])
      
      const historyState: HistoryState = {
        canvasState,
        layerStates: JSON.parse(JSON.stringify(layers)), // 深拷贝图层状态
        timestamp: Date.now(),
        description,
      }

      setHistory((prev) => {
        // 删除当前索引之后的所有历史记录（分支历史）
        const newHistory = prev.slice(0, currentIndex + 1)
        
        // 添加新的历史状态
        newHistory.push(historyState)
        
        // 限制历史记录大小
        if (newHistory.length > maxHistorySize) {
          newHistory.shift() // 删除最旧的记录
          setCurrentIndex(prev => Math.max(prev - 1, 0))
        } else {
          setCurrentIndex(newHistory.length - 1)
        }
        
        return newHistory
      })
    }, debounceMs)
  }, [fabricCanvas, layers, currentIndex, maxHistorySize, debounceMs])

  // 立即保存状态（无防抖）
  const saveStateImmediate = useCallback((description?: string) => {
    if (!fabricCanvas) return

    // 清除防抖定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const canvasState = fabricCanvas.toJSON([
      'id', 'selectable', 'evented', 'excludeFromExport'
    ])
    
    const historyState: HistoryState = {
      canvasState,
      layerStates: JSON.parse(JSON.stringify(layers)),
      timestamp: Date.now(),
      description,
    }

    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(historyState)
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        setCurrentIndex(prev => Math.max(prev - 1, 0))
      } else {
        setCurrentIndex(newHistory.length - 1)
      }
      
      return newHistory
    })
  }, [fabricCanvas, layers, currentIndex, maxHistorySize])

  // 恢复到指定的历史状态
  const restoreState = useCallback((historyState: HistoryState) => {
    if (!fabricCanvas) return

    // 恢复画布状态
    fabricCanvas.loadFromJSON(historyState.canvasState, () => {
      fabricCanvas.renderAll()
    })

    // 恢复图层状态
    // TODO: 实现图层状态恢复
    // useLayerStore.setState({ layers: historyState.layerStates })
  }, [fabricCanvas])

  // 撤销操作
  const undo = useCallback(() => {
    if (currentIndex <= 0 || history.length === 0) return false

    const prevIndex = currentIndex - 1
    const prevState = history[prevIndex]
    
    if (prevState) {
      restoreState(prevState)
      setCurrentIndex(prevIndex)
      return true
    }
    
    return false
  }, [currentIndex, history, restoreState])

  // 重做操作
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return false

    const nextIndex = currentIndex + 1
    const nextState = history[nextIndex]
    
    if (nextState) {
      restoreState(nextState)
      setCurrentIndex(nextIndex)
      return true
    }
    
    return false
  }, [currentIndex, history, restoreState])

  // 跳转到指定历史记录
  const jumpToState = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return false

    const targetState = history[index]
    if (targetState) {
      restoreState(targetState)
      setCurrentIndex(index)
      return true
    }
    
    return false
  }, [history, restoreState])

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
  }, [])

  // 获取历史记录信息
  const getHistoryInfo = useCallback(() => {
    return {
      total: history.length,
      current: currentIndex,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      states: history.map((state, index) => ({
        index,
        description: state.description || `状态 ${index + 1}`,
        timestamp: state.timestamp,
        isCurrent: index === currentIndex,
      })),
    }
  }, [history, currentIndex])

  // 初始化历史记录（保存初始状态）
  const initHistory = useCallback(() => {
    if (fabricCanvas && history.length === 0) {
      saveStateImmediate('初始状态')
    }
  }, [fabricCanvas, history.length, saveStateImmediate])

  return {
    // 状态
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex,
    
    // 方法
    saveState,
    saveStateImmediate,
    undo,
    redo,
    jumpToState,
    clearHistory,
    getHistoryInfo,
    initHistory,
  }
}