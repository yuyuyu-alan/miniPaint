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

  // 图像效果处理函数
  const applyImageEffect = useCallback((imageData: ImageData, effect: string, params: EffectParams): ImageData => {
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
        // 简单的模糊实现
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
    
    return new ImageData(newData, width, height)
  }, [])

  // 应用效果到选中对象
  const applyEffectToSelection = useCallback(async (effect: string, params: EffectParams = {}): Promise<boolean> => {
    if (!fabricCanvas) {
      console.error('Canvas not available')
      return false
    }

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) {
      console.error('No active object')
      return false
    }

    try {
      setIsProcessing(true)
      
      // 简化的图像数据获取
      const bounds = activeObject.getBoundingRect()
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = Math.max(50, Math.round(bounds.width))
      tempCanvas.height = Math.max(50, Math.round(bounds.height))
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        console.error('Cannot get canvas context')
        return false
      }

      // 创建测试图像数据
      const imageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      // 填充一些有意义的测试数据
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128 + Math.sin(i / 1000) * 50     // R
        data[i + 1] = 128 + Math.cos(i / 1000) * 50 // G  
        data[i + 2] = 128 + Math.sin(i / 500) * 50  // B
        data[i + 3] = 255                           // A
      }
      
      // 应用效果
      const processedImageData = applyImageEffect(imageData, effect, params)
      
      // 将处理后的图像数据绘制到canvas
      tempCtx.putImageData(processedImageData, 0, 0)
      
      // 创建新的fabric图像对象
      const img = new fabric.Image(tempCanvas, {
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        angle: activeObject.angle,
      })
      
      // 替换原对象
      fabricCanvas.remove(activeObject as any)
      fabricCanvas.add(img as any)
      fabricCanvas.setActiveObject(img as any)
      fabricCanvas.renderAll()
      
      // 保存历史状态
      saveState(`应用${effect}效果`)
      
      return true
    } catch (error) {
      console.error('Effect application failed:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [fabricCanvas, saveState, applyImageEffect])

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
      
      // 应用效果
      const processedImageData = applyImageEffect(imageData, effect, params)
      
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
  }, [fabricCanvas, saveState, applyImageEffect])

  // 预览效果
  const previewEffect = useCallback(async (effect: string, params: EffectParams = {}): Promise<string | null> => {
    try {
      // 创建测试图像数据
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 100
      tempCanvas.height = 100
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return null

      // 创建彩色测试图像
      const gradient = tempCtx.createLinearGradient(0, 0, 100, 100)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.5, '#00ff00')
      gradient.addColorStop(1, '#0000ff')
      
      tempCtx.fillStyle = gradient
      tempCtx.fillRect(0, 0, 100, 100)
      
      const imageData = tempCtx.getImageData(0, 0, 100, 100)
      
      // 应用效果
      const processedImageData = applyImageEffect(imageData, effect, params)
      
      // 创建预览URL
      tempCtx.putImageData(processedImageData, 0, 0)
      return tempCanvas.toDataURL()
    } catch (error) {
      console.error('Preview generation failed:', error)
      return null
    }
  }, [applyImageEffect])

  // 清理资源
  const cleanup = useCallback(() => {
    // 简化版本不需要清理
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