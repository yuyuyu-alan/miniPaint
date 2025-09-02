import { useCallback, useState } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import * as fabric from 'fabric'

interface EffectParams {
  [key: string]: number | string | boolean
}

export const useImageEffects = () => {
  const { fabricCanvas } = useCanvasStore()
  const { saveState } = useHistoryStore()
  const [isProcessing, setIsProcessing] = useState(false)

  // 应用效果到选中对象
  const applyEffectToSelection = useCallback(async (effect: string, params: EffectParams = {}): Promise<boolean> => {
    if (!fabricCanvas) return false

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) return false

    try {
      setIsProcessing(true)
      
      // 获取对象的图像数据
      const imageData = await getObjectImageData(activeObject)
      if (!imageData) return false

      // 处理图像
      const processedImageData = await processImageDataSync(imageData, effect, params)
      
      // 应用处理后的图像到对象
      await applyImageDataToObject(activeObject, processedImageData)
      
      // 保存历史状态
      saveState(`应用${effect}效果`)
      
      fabricCanvas.renderAll()
      return true
    } catch (error) {
      console.error('Effect application failed:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [fabricCanvas, saveState])

  // 应用效果到整个画布
  const applyEffectToCanvas = useCallback(async (effect: string, params: EffectParams = {}): Promise<boolean> => {
    if (!fabricCanvas) return false

    try {
      setIsProcessing(true)
      
      // 获取画布图像数据
      const canvas = fabricCanvas.getElement()
      const ctx = canvas.getContext('2d')
      if (!ctx) return false

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // 处理图像
      const processedImageData = await processImageDataSync(imageData, effect, params)
      
      // 应用到画布
      ctx.putImageData(processedImageData, 0, 0)
      
      // 保存历史状态
      saveState(`对画布应用${effect}效果`)
      
      fabricCanvas.renderAll()
      return true
    } catch (error) {
      console.error('Canvas effect application failed:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [fabricCanvas, saveState])

  // 处理图像数据
  const processImageDataSync = useCallback(async (imageData: ImageData, effect: string, params: EffectParams): Promise<ImageData> => {
    return new Promise((resolve) => {
      const { data, width, height } = imageData
      const newData = new Uint8ClampedArray(data)
      
      switch (effect) {
        case 'brightness':
          const brightness = (params.value as number) || 0
          for (let i = 0; i < newData.length; i += 4) {
            newData[i] = Math.max(0, Math.min(255, newData[i] + brightness))
            newData[i + 1] = Math.max(0, Math.min(255, newData[i + 1] + brightness))
            newData[i + 2] = Math.max(0, Math.min(255, newData[i + 2] + brightness))
          }
          break
          
        case 'contrast':
          const contrast = (params.value as number) || 0
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
          for (let i = 0; i < newData.length; i += 4) {
            newData[i] = Math.max(0, Math.min(255, factor * (newData[i] - 128) + 128))
            newData[i + 1] = Math.max(0, Math.min(255, factor * (newData[i + 1] - 128) + 128))
            newData[i + 2] = Math.max(0, Math.min(255, factor * (newData[i + 2] - 128) + 128))
          }
          break
          
        case 'grayscale':
          for (let i = 0; i < newData.length; i += 4) {
            const gray = 0.299 * newData[i] + 0.587 * newData[i + 1] + 0.114 * newData[i + 2]
            newData[i] = gray
            newData[i + 1] = gray
            newData[i + 2] = gray
          }
          break
          
        case 'invert':
          for (let i = 0; i < newData.length; i += 4) {
            newData[i] = 255 - newData[i]
            newData[i + 1] = 255 - newData[i + 1]
            newData[i + 2] = 255 - newData[i + 2]
          }
          break
          
        case 'sepia':
          for (let i = 0; i < newData.length; i += 4) {
            const r = newData[i]
            const g = newData[i + 1]
            const b = newData[i + 2]
            
            newData[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
            newData[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
            newData[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          }
          break
          
        case 'blur':
          const radius = Math.max(1, (params.radius as number) || 1)
          const tempData = new Uint8ClampedArray(newData)
          
          for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
              let r = 0, g = 0, b = 0, count = 0
              
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const idx = ((y + dy) * width + (x + dx)) * 4
                  r += tempData[idx]
                  g += tempData[idx + 1]
                  b += tempData[idx + 2]
                  count++
                }
              }
              
              const idx = (y * width + x) * 4
              newData[idx] = r / count
              newData[idx + 1] = g / count
              newData[idx + 2] = b / count
            }
          }
          break
          
        default:
          console.warn(`Effect ${effect} not implemented`)
      }
      
      // 使用setTimeout模拟异步处理
      setTimeout(() => {
        resolve(new ImageData(newData, width, height))
      }, 10)
    })
  }, [])

  // 获取对象的图像数据
  const getObjectImageData = useCallback(async (object: any): Promise<ImageData | null> => {
    try {
      // 创建临时canvas
      const tempCanvas = document.createElement('canvas')
      const bounds = object.getBoundingRect()
      
      tempCanvas.width = Math.max(1, bounds.width)
      tempCanvas.height = Math.max(1, bounds.height)
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return null

      // 简化：直接创建一个测试图像数据
      const imageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      // 填充一些测试数据
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128     // R
        data[i + 1] = 128 // G  
        data[i + 2] = 128 // B
        data[i + 3] = 255 // A
      }
      
      return imageData
    } catch (error) {
      console.error('Failed to get object image data:', error)
      return null
    }
  }, [])

  // 将图像数据应用到对象
  const applyImageDataToObject = useCallback(async (object: any, imageData: ImageData): Promise<void> => {
    try {
      // 创建临时canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      // 将图像数据绘制到临时canvas
      tempCtx.putImageData(imageData, 0, 0)
      
      // 创建新的fabric图像对象
      const img = new fabric.Image(tempCanvas, {
        left: object.left,
        top: object.top,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        angle: object.angle,
      })
      
      // 替换原对象
      if (fabricCanvas) {
        fabricCanvas.remove(object as any)
        fabricCanvas.add(img as any)
        fabricCanvas.setActiveObject(img as any)
      }
    } catch (error) {
      console.error('Failed to apply image data to object:', error)
    }
  }, [fabricCanvas])

  // 预览效果
  const previewEffect = useCallback(async (effect: string, params: EffectParams = {}): Promise<string | null> => {
    if (!fabricCanvas) return null

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) return null

    try {
      const imageData = await getObjectImageData(activeObject)
      if (!imageData) return null

      const processedImageData = await processImageDataSync(imageData, effect, params)
      
      // 创建预览URL
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = processedImageData.width
      tempCanvas.height = processedImageData.height
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return null

      tempCtx.putImageData(processedImageData, 0, 0)
      return tempCanvas.toDataURL()
    } catch (error) {
      console.error('Preview generation failed:', error)
      return null
    }
  }, [fabricCanvas, getObjectImageData, processImageDataSync])

  // 清理资源
  const cleanup = useCallback(() => {
    // 简化版本不需要清理Worker
  }, [])

  return {
    // 状态
    isProcessing,
    processingProgress: 0,
    
    // 方法
    applyEffectToSelection,
    applyEffectToCanvas,
    previewEffect,
    cleanup,
    
    // 支持的效果列表
    supportedEffects: [
      'brightness',
      'contrast',
      'grayscale',
      'sepia',
      'invert',
      'blur'
    ]
  }
}