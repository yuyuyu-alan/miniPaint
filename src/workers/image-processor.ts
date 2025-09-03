// 图像处理 Web Worker
// 支持各种图像效果的并行处理

interface ProcessMessage {
  id: string
  imageData: ImageData
  effect: string
  params: Record<string, any>
}

interface ProcessResult {
  id: string
  processedData: ImageData
  error?: string
}

// 基础图像处理函数
class ImageEffects {
  // 亮度调节
  static brightness(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const brightness = Math.max(-100, Math.min(100, value))
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + brightness))     // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)) // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)) // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 对比度调节
  static contrast(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const contrast = Math.max(-100, Math.min(100, value))
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))     // Red
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)) // Green
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)) // Blue
      // Alpha channel remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 模糊效果（简化的高斯模糊）
  static blur(imageData: ImageData, radius: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(data.length)
    
    const blurRadius = Math.max(1, Math.min(10, radius))
    const kernel = ImageEffects.createGaussianKernel(blurRadius)
    const kernelSize = kernel.length
    const halfKernel = Math.floor(kernelSize / 2)
    
    // 水平模糊
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        
        for (let i = 0; i < kernelSize; i++) {
          const sampleX = Math.max(0, Math.min(width - 1, x + i - halfKernel))
          const idx = (y * width + sampleX) * 4
          const weight = kernel[i]
          
          r += data[idx] * weight
          g += data[idx + 1] * weight
          b += data[idx + 2] * weight
          a += data[idx + 3] * weight
        }
        
        const outIdx = (y * width + x) * 4
        output[outIdx] = r
        output[outIdx + 1] = g
        output[outIdx + 2] = b
        output[outIdx + 3] = a
      }
    }
    
    // 垂直模糊
    const finalOutput = new Uint8ClampedArray(data.length)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        
        for (let i = 0; i < kernelSize; i++) {
          const sampleY = Math.max(0, Math.min(height - 1, y + i - halfKernel))
          const idx = (sampleY * width + x) * 4
          const weight = kernel[i]
          
          r += output[idx] * weight
          g += output[idx + 1] * weight
          b += output[idx + 2] * weight
          a += output[idx + 3] * weight
        }
        
        const outIdx = (y * width + x) * 4
        finalOutput[outIdx] = Math.max(0, Math.min(255, r))
        finalOutput[outIdx + 1] = Math.max(0, Math.min(255, g))
        finalOutput[outIdx + 2] = Math.max(0, Math.min(255, b))
        finalOutput[outIdx + 3] = Math.max(0, Math.min(255, a))
      }
    }
    
    return new ImageData(finalOutput, width, height)
  }

  // 饱和度调节
  static saturate(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const saturation = Math.max(-100, Math.min(100, value)) / 100
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 计算灰度值
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
      
      // 应用饱和度
      data[i] = Math.max(0, Math.min(255, gray + saturation * (r - gray)))
      data[i + 1] = Math.max(0, Math.min(255, gray + saturation * (g - gray)))
      data[i + 2] = Math.max(0, Math.min(255, gray + saturation * (b - gray)))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 色相调节
  static hueRotate(imageData: ImageData, angle: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      
      // RGB to HSL and back with hue rotation
      const newR = (0.213 + cos * 0.787 - sin * 0.213) * r +
                  (0.715 - cos * 0.715 - sin * 0.715) * g +
                  (0.072 - cos * 0.072 + sin * 0.928) * b
      
      const newG = (0.213 - cos * 0.213 + sin * 0.143) * r +
                  (0.715 + cos * 0.285 + sin * 0.140) * g +
                  (0.072 - cos * 0.072 - sin * 0.283) * b
      
      const newB = (0.213 - cos * 0.213 - sin * 0.787) * r +
                  (0.715 - cos * 0.715 + sin * 0.715) * g +
                  (0.072 + cos * 0.928 + sin * 0.072) * b
      
      data[i] = Math.max(0, Math.min(255, newR * 255))
      data[i + 1] = Math.max(0, Math.min(255, newG * 255))
      data[i + 2] = Math.max(0, Math.min(255, newB * 255))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 反相
  static invert(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]         // Red
      data[i + 1] = 255 - data[i + 1] // Green
      data[i + 2] = 255 - data[i + 2] // Blue
      // Alpha channel remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 灰度化
  static grayscale(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2]
      data[i] = gray     // Red
      data[i + 1] = gray // Green
      data[i + 2] = gray // Blue
      // Alpha channel remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 棕褐色效果
  static sepia(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 锐化效果
  static sharpen(imageData: ImageData): ImageData {
    return ImageEffects.applyConvolution(imageData, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ])
  }

  // 浮雕效果
  static emboss(imageData: ImageData): ImageData {
    return ImageEffects.applyConvolution(imageData, [
      -2, -1, 0,
      -1, 1, 1,
      0, 1, 2
    ])
  }

  // 边缘检测
  static edgeDetection(imageData: ImageData): ImageData {
    return ImageEffects.applyConvolution(imageData, [
      -1, -1, -1,
      -1, 8, -1,
      -1, -1, -1
    ])
  }

  // 复古效果
  static vintage(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 应用复古色调
      data[i] = Math.min(255, r * 0.9 + g * 0.1)
      data[i + 1] = Math.min(255, r * 0.1 + g * 0.8 + b * 0.1)
      data[i + 2] = Math.min(255, g * 0.1 + b * 0.7)
      
      // 降低饱和度
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      data[i] = data[i] * 0.7 + gray * 0.3
      data[i + 1] = data[i + 1] * 0.7 + gray * 0.3
      data[i + 2] = data[i + 2] * 0.7 + gray * 0.3
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 噪点效果
  static noise(imageData: ImageData, amount: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amount
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 暗角效果
  static vignette(imageData: ImageData, strength: number): ImageData {
    const { data, width, height } = imageData
    const newData = new Uint8ClampedArray(data)
    const centerX = width / 2
    const centerY = height / 2
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const vignette = 1 - (distance / maxDistance) * strength
        const factor = Math.max(0, Math.min(1, vignette))
        
        const idx = (y * width + x) * 4
        newData[idx] *= factor
        newData[idx + 1] *= factor
        newData[idx + 2] *= factor
      }
    }
    
    return new ImageData(newData, width, height)
  }

  // 卷积操作辅助方法
  static applyConvolution(imageData: ImageData, kernel: number[]): ImageData {
    const { data, width, height } = imageData
    const newData = new Uint8ClampedArray(data)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const weight = kernel[(ky + 1) * 3 + (kx + 1)]
            
            r += data[idx] * weight
            g += data[idx + 1] * weight
            b += data[idx + 2] * weight
          }
        }
        
        const idx = (y * width + x) * 4
        newData[idx] = Math.max(0, Math.min(255, r))
        newData[idx + 1] = Math.max(0, Math.min(255, g))
        newData[idx + 2] = Math.max(0, Math.min(255, b))
      }
    }
    
    return new ImageData(newData, width, height)
  }

  // 创建高斯模糊内核
  static createGaussianKernel(radius: number): number[] {
    const size = radius * 2 + 1
    const kernel = new Array(size)
    const sigma = radius / 3
    const sigma2 = 2 * sigma * sigma
    const sqrtSigma = Math.sqrt(sigma2 * Math.PI)
    let sum = 0
    
    for (let i = 0; i < size; i++) {
      const x = i - radius
      const value = Math.exp(-(x * x) / sigma2) / sqrtSigma
      kernel[i] = value
      sum += value
    }
    
    // 归一化
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum
    }
    
    return kernel
  }
}

// Worker 消息处理
self.onmessage = function(e: MessageEvent<ProcessMessage>) {
  const { id, imageData, effect, params } = e.data
  
  try {
    let processedData: ImageData
    
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
      
      case 'saturate':
        processedData = ImageEffects.saturate(imageData, params.value || 0)
        break
      
      case 'hue-rotate':
        processedData = ImageEffects.hueRotate(imageData, params.angle || 0)
        break
      
      case 'invert':
        processedData = ImageEffects.invert(imageData)
        break
      
      case 'grayscale':
        processedData = ImageEffects.grayscale(imageData)
        break
      
      case 'sepia':
        processedData = ImageEffects.sepia(imageData)
        break
      
      case 'sharpen':
        processedData = ImageEffects.sharpen(imageData)
        break
      
      case 'emboss':
        processedData = ImageEffects.emboss(imageData)
        break
      
      case 'edge':
        processedData = ImageEffects.edgeDetection(imageData)
        break
      
      case 'vintage':
        processedData = ImageEffects.vintage(imageData)
        break
      
      case 'noise':
        processedData = ImageEffects.noise(imageData, params.amount || 10)
        break
      
      case 'vignette':
        processedData = ImageEffects.vignette(imageData, params.strength || 0.5)
        break
      
      default:
        throw new Error(`Unknown effect: ${effect}`)
    }
    
    const result: ProcessResult = {
      id,
      processedData
    }
    
    self.postMessage(result)
  } catch (error) {
    const result: ProcessResult = {
      id,
      processedData: imageData, // 返回原图
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    self.postMessage(result)
  }
}

// 导出空对象以确保这是一个模块
export {}