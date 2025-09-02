import { useCallback, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import * as fabric from 'fabric'

interface EffectParams {
  [key: string]: any
}

interface ProcessMessage {
  id: string
  imageData: ImageData
  effect: string
  params: EffectParams
}

interface ProcessResult {
  id: string
  processedData: ImageData
  error?: string
}

export const useImageEffects = () => {
  const { fabricCanvas } = useCanvasStore()
  const { saveState } = useHistoryStore()
  const workerRef = useRef<Worker | null>(null)
  const pendingOperations = useRef<Map<string, (result: ProcessResult) => void>>(new Map())

  // 初始化 Web Worker
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      // 创建内联 worker，避免文件路径问题
      const workerCode = `
        // 图像处理函数（简化版）
        const ImageEffects = {
          brightness: (imageData, value) => {
            const data = new Uint8ClampedArray(imageData.data)
            const brightness = Math.max(-100, Math.min(100, value))
            
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.max(0, Math.min(255, data[i] + brightness))
              data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness))
              data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness))
            }
            
            return new ImageData(data, imageData.width, imageData.height)
          },

          contrast: (imageData, value) => {
            const data = new Uint8ClampedArray(imageData.data)
            const contrast = Math.max(-100, Math.min(100, value))
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
            
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))
              data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
              data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))
            }
            
            return new ImageData(data, imageData.width, imageData.height)
          },

          blur: (imageData, radius) => {
            // 简化的模糊算法
            const data = new Uint8ClampedArray(imageData.data)
            const width = imageData.width
            const height = imageData.height
            const output = new Uint8ClampedArray(data.length)
            
            const blurRadius = Math.max(1, Math.min(5, radius))
            
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0
                
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                  for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx))
                    const ny = Math.max(0, Math.min(height - 1, y + dy))
                    const idx = (ny * width + nx) * 4
                    
                    r += data[idx]
                    g += data[idx + 1]
                    b += data[idx + 2]
                    a += data[idx + 3]
                    count++
                  }
                }
                
                const outIdx = (y * width + x) * 4
                output[outIdx] = r / count
                output[outIdx + 1] = g / count
                output[outIdx + 2] = b / count
                output[outIdx + 3] = a / count
              }
            }
            
            return new ImageData(output, width, height)
          },

          grayscale: (imageData) => {
            const data = new Uint8ClampedArray(imageData.data)
            
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
              data[i] = gray
              data[i + 1] = gray
              data[i + 2] = gray
            }
            
            return new ImageData(data, imageData.width, imageData.height)
          },

          invert: (imageData) => {
            const data = new Uint8ClampedArray(imageData.data)
            
            for (let i = 0; i < data.length; i += 4) {
              data[i] = 255 - data[i]
              data[i + 1] = 255 - data[i + 1]
              data[i + 2] = 255 - data[i + 2]
            }
            
            return new ImageData(data, imageData.width, imageData.height)
          }
        }

        self.onmessage = function(e) {
          const { id, imageData, effect, params } = e.data
          
          try {
            let processedData
            
            switch (effect) {
              case 'brightness':
                processedData = ImageEffects.brightness(imageData, params.value || 0)
                break
              case 'contrast':
                processedData = ImageEffects.contrast(imageData, params.value || 0)
                break
              case 'blur':
                processedData = ImageEffects.blur(imageData, params.radius || 1)
                break
              case 'grayscale':
                processedData = ImageEffects.grayscale(imageData)
                break
              case 'invert':
                processedData = ImageEffects.invert(imageData)
                break
              default:
                throw new Error('Unknown effect: ' + effect)
            }
            
            self.postMessage({ id, processedData })
          } catch (error) {
            self.postMessage({ id, processedData: imageData, error: error.message })
          }
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      workerRef.current = new Worker(URL.createObjectURL(blob))
      
      workerRef.current.onmessage = (e: MessageEvent<ProcessResult>) => {
        const { id, processedData, error } = e.data
        const callback = pendingOperations.current.get(id)
        
        if (callback) {
          callback(e.data)
          pendingOperations.current.delete(id)
        }
        
        if (error) {
          console.error('Image processing error:', error)
        }
      }
    }
  }, [])

  // 获取对象的图像数据
  const getObjectImageData = useCallback((obj: fabric.Object): ImageData | null => {
    if (!fabricCanvas) return null

    try {
      // 创建临时canvas来获取对象的图像数据
      const bounds = obj.getBoundingRect()
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      if (!tempCtx || bounds.width <= 0 || bounds.height <= 0) return null
      
      tempCanvas.width = bounds.width
      tempCanvas.height = bounds.height
      
      // 渲染对象到临时canvas
      const fabricTempCanvas = new fabric.StaticCanvas(tempCanvas)
      fabricTempCanvas.add(obj.clone())
      fabricTempCanvas.renderAll()
      
      return tempCtx.getImageData(0, 0, bounds.width, bounds.height)
    } catch (error) {
      console.error('Failed to get object image data:', error)
      return null
    }
  }, [fabricCanvas])

  // 应用处理后的图像数据到对象
  const applyImageDataToObject = useCallback((obj: fabric.Object, imageData: ImageData) => {
    if (!fabricCanvas) return

    try {
      // 创建临时canvas
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      if (!tempCtx) return
      
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      tempCtx.putImageData(imageData, 0, 0)
      
      // 创建新的图像对象
      fabric.Image.fromURL(tempCanvas.toDataURL(), (img) => {
        if (!img) return
        
        // 复制原对象的属性
        img.set({
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          opacity: obj.opacity,
          selectable: obj.selectable,
        })
        
        // 替换原对象
        fabricCanvas.remove(obj)
        fabricCanvas.add(img)
        fabricCanvas.setActiveObject(img)
        fabricCanvas.renderAll()
        
        // 保存历史状态
        saveState('应用图像效果')
      })
    } catch (error) {
      console.error('Failed to apply processed image data:', error)
    }
  }, [fabricCanvas, saveState])

  // 应用效果到选中的对象
  const applyEffect = useCallback(async (effect: string, params: EffectParams = {}) => {
    if (!fabricCanvas) return false

    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) {
      console.warn('No object selected')
      return false
    }

    // 初始化 Worker
    initWorker()
    
    if (!workerRef.current) {
      console.error('Failed to initialize worker')
      return false
    }

    // 获取对象图像数据
    const imageData = getObjectImageData(activeObject)
    if (!imageData) {
      console.error('Failed to get object image data')
      return false
    }

    return new Promise<boolean>((resolve) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      // 注册回调
      pendingOperations.current.set(id, (result: ProcessResult) => {
        if (result.error) {
          console.error('Effect processing failed:', result.error)
          resolve(false)
        } else {
          // 应用处理后的图像
          applyImageDataToObject(activeObject, result.processedData)
          resolve(true)
        }
      })

      // 发送处理请求
      const message: ProcessMessage = {
        id,
        imageData,
        effect,
        params
      }
      
      workerRef.current?.postMessage(message)
    })
  }, [fabricCanvas, initWorker, getObjectImageData, applyImageDataToObject])

  // 预览效果（不保存到历史记录）
  const previewEffect = useCallback(async (effect: string, params: EffectParams = {}) => {
    // TODO: 实现预览功能，可以在预览模式下显示效果但不改变原对象
    return applyEffect(effect, params)
  }, [applyEffect])

  // 清理 Worker
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingOperations.current.clear()
  }, [])

  return {
    applyEffect,
    previewEffect,
    cleanup,
    // 快捷效果方法
    brightness: (value: number) => applyEffect('brightness', { value }),
    contrast: (value: number) => applyEffect('contrast', { value }),
    blur: (radius: number) => applyEffect('blur', { radius }),
    grayscale: () => applyEffect('grayscale'),
    invert: () => applyEffect('invert'),
  }
}