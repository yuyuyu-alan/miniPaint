import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import * as fabric from 'fabric'
import type { Layer } from '@/types'

interface LayerStore {
  layers: Layer[]
  activeLayerId: string | null
  
  // CRUD 操作
  addLayer: (layer: Omit<Layer, 'id'>) => string
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  duplicateLayer: (id: string) => string | null
  
  // 图层顺序操作
  moveLayer: (id: string, newIndex: number) => void
  moveLayerUp: (id: string) => void
  moveLayerDown: (id: string) => void
  
  // 图层选择
  setActiveLayer: (id: string | null) => void
  selectNextLayer: () => void
  selectPreviousLayer: () => void
  
  // 图层属性操作
  toggleLayerVisibility: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  setLayerLocked: (id: string, locked: boolean) => void
  
  // 工具方法
  getActiveLayer: () => Layer | null
  getLayerById: (id: string) => Layer | null
  getVisibleLayers: () => Layer[]
  clearAllLayers: () => void
  
  // 图层合并和展平
  mergeLayers: (layerIds: string[]) => string | null
  flattenLayers: () => void
}

export const useLayerStore = create<LayerStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    layers: [
      {
        id: 'background',
        name: '背景',
        visible: true,
        opacity: 100,
        locked: false,
        type: 'raster',
      }
    ],
    activeLayerId: 'background',

    // CRUD 操作
    addLayer: (layerData) => {
      const id = uuidv4()
      const newLayer: Layer = {
        ...layerData,
        id,
        name: layerData.name || `图层 ${get().layers.length}`,
      }

      set((state) => ({
        layers: [newLayer, ...state.layers],
        activeLayerId: id,
      }))

      return id
    },

    removeLayer: (id) => {
      const { layers, activeLayerId } = get()
      
      // 不允许删除唯一的图层
      if (layers.length <= 1) return
      
      const layerIndex = layers.findIndex(layer => layer.id === id)
      if (layerIndex === -1) return

      const newLayers = layers.filter(layer => layer.id !== id)
      let newActiveId = activeLayerId

      // 如果删除的是当前激活图层，选择相邻的图层
      if (activeLayerId === id) {
        if (layerIndex < newLayers.length) {
          newActiveId = newLayers[layerIndex].id
        } else if (newLayers.length > 0) {
          newActiveId = newLayers[newLayers.length - 1].id
        } else {
          newActiveId = null
        }
      }

      set({
        layers: newLayers,
        activeLayerId: newActiveId,
      })
    },

    updateLayer: (id, updates) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === id ? { ...layer, ...updates } : layer
        ),
      }))
    },

    duplicateLayer: (id) => {
      const { layers } = get()
      const originalLayer = layers.find(layer => layer.id === id)
      if (!originalLayer) return null

      const newId = uuidv4()
      const duplicatedLayer: Layer = {
        ...originalLayer,
        id: newId,
        name: `${originalLayer.name} 副本`,
        fabricObject: originalLayer.fabricObject ? 
          fabric.util.object.clone(originalLayer.fabricObject) : undefined,
      }

      const originalIndex = layers.findIndex(layer => layer.id === id)
      const newLayers = [...layers]
      newLayers.splice(originalIndex, 0, duplicatedLayer)

      set({
        layers: newLayers,
        activeLayerId: newId,
      })

      return newId
    },

    // 图层顺序操作
    moveLayer: (id, newIndex) => {
      const { layers } = get()
      const currentIndex = layers.findIndex(layer => layer.id === id)
      if (currentIndex === -1) return

      const newLayers = [...layers]
      const [movedLayer] = newLayers.splice(currentIndex, 1)
      newLayers.splice(newIndex, 0, movedLayer)

      set({ layers: newLayers })
    },

    moveLayerUp: (id) => {
      const { layers } = get()
      const currentIndex = layers.findIndex(layer => layer.id === id)
      if (currentIndex <= 0) return

      get().moveLayer(id, currentIndex - 1)
    },

    moveLayerDown: (id) => {
      const { layers } = get()
      const currentIndex = layers.findIndex(layer => layer.id === id)
      if (currentIndex >= layers.length - 1) return

      get().moveLayer(id, currentIndex + 1)
    },

    // 图层选择
    setActiveLayer: (id) => {
      set({ activeLayerId: id })
    },

    selectNextLayer: () => {
      const { layers, activeLayerId } = get()
      if (!activeLayerId) return

      const currentIndex = layers.findIndex(layer => layer.id === activeLayerId)
      const nextIndex = (currentIndex - 1 + layers.length) % layers.length
      set({ activeLayerId: layers[nextIndex].id })
    },

    selectPreviousLayer: () => {
      const { layers, activeLayerId } = get()
      if (!activeLayerId) return

      const currentIndex = layers.findIndex(layer => layer.id === activeLayerId)
      const prevIndex = (currentIndex + 1) % layers.length
      set({ activeLayerId: layers[prevIndex].id })
    },

    // 图层属性操作
    toggleLayerVisibility: (id) => {
      const layer = get().getLayerById(id)
      if (layer) {
        get().updateLayer(id, { visible: !layer.visible })
      }
    },

    setLayerOpacity: (id, opacity) => {
      const clampedOpacity = Math.min(Math.max(opacity, 0), 100)
      get().updateLayer(id, { opacity: clampedOpacity })
    },

    setLayerLocked: (id, locked) => {
      get().updateLayer(id, { locked })
    },

    // 工具方法
    getActiveLayer: () => {
      const { layers, activeLayerId } = get()
      return layers.find(layer => layer.id === activeLayerId) || null
    },

    getLayerById: (id) => {
      const { layers } = get()
      return layers.find(layer => layer.id === id) || null
    },

    getVisibleLayers: () => {
      const { layers } = get()
      return layers.filter(layer => layer.visible)
    },

    clearAllLayers: () => {
      set({
        layers: [{
          id: 'background',
          name: '背景',
          visible: true,
          opacity: 100,
          locked: false,
          type: 'raster',
        }],
        activeLayerId: 'background',
      })
    },

    // 图层合并和展平
    mergeLayers: (layerIds) => {
      // TODO: 实现图层合并逻辑
      console.log('mergeLayers not implemented yet', layerIds)
      return null
    },

    flattenLayers: () => {
      // TODO: 实现图层展平逻辑
      console.log('flattenLayers not implemented yet')
    },
  }))
)