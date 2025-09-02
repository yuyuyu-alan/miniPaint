// 图像效果处理 Web Worker
// 独立的Worker文件，用于处理复杂的图像计算

// 消息接口定义
const MESSAGE_TYPES = {
  PROCESS_IMAGE: 'PROCESS_IMAGE',
  IMAGE_PROCESSED: 'IMAGE_PROCESSED',
  ERROR: 'ERROR'
}

// 图像效果处理类
class ImageEffects {
  // 亮度调整
  static brightness(imageData, value) {
    const data = new Uint8ClampedArray(imageData.data)
    const adjustment = value
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + adjustment))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 对比度调整
  static contrast(imageData, value) {
    const data = new Uint8ClampedArray(imageData.data)
    const factor = (259 * (value + 255)) / (255 * (259 - value))
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 饱和度调整
  static saturate(imageData, value) {
    const data = new Uint8ClampedArray(imageData.data)
    const factor = value / 100
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      
      data[i] = Math.max(0, Math.min(255, gray + factor * (r - gray)))
      data[i + 1] = Math.max(0, Math.min(255, gray + factor * (g - gray)))
      data[i + 2] = Math.max(0, Math.min(255, gray + factor * (b - gray)))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 色相旋转
  static hueRotate(imageData, angle) {
    const data = new Uint8ClampedArray(imageData.data)
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      
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

  // 高斯模糊
  static blur(imageData, radius) {
    const { data, width, height } = imageData
    const newData = new Uint8ClampedArray(data)
    const tempData = new Uint8ClampedArray(data)
    
    // 创建高斯核
    const kernel = ImageEffects.createGaussianKernel(radius)
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
        tempData[outIdx] = r
        tempData[outIdx + 1] = g
        tempData[outIdx + 2] = b
        tempData[outIdx + 3] = a
      }
    }
    
    // 垂直模糊
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        
        for (let i = 0; i < kernelSize; i++) {
          const sampleY = Math.max(0, Math.min(height - 1, y + i - halfKernel))
          const idx = (sampleY * width + x) * 4
          const weight = kernel[i]
          
          r += tempData[idx] * weight
          g += tempData[idx + 1] * weight
          b += tempData[idx + 2] * weight
          a += tempData[idx + 3] * weight
        }
        
        const outIdx = (y * width + x) * 4
        newData[outIdx] = Math.max(0, Math.min(255, r))
        newData[outIdx + 1] = Math.max(0, Math.min(255, g))
        newData[outIdx + 2] = Math.max(0, Math.min(255, b))
        newData[outIdx + 3] = Math.max(0, Math.min(255, a))
      }
    }
    
    return new ImageData(newData, width, height)
  }

  // 创建高斯核
  static createGaussianKernel(radius) {
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

  // 锐化效果
  static sharpen(imageData) {
    return ImageEffects.applyConvolution(imageData, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ])
  }

  // 浮雕效果
  static emboss(imageData) {
    return ImageEffects.applyConvolution(imageData, [
      -2, -1, 0,
      -1, 1, 1,
      0, 1, 2
    ])
  }

  // 边缘检测
  static edgeDetection(imageData) {
    return ImageEffects.applyConvolution(imageData, [
      -1, -1, -1,
      -1, 8, -1,
      -1, -1, -1
    ])
  }

  // 卷积操作
  static applyConvolution(imageData, kernel) {
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

  // 灰度效果
  static grayscale(imageData) {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      data[i] = gray
      data[i + 1] = gray
      data[i + 2] = gray
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 棕褐色效果
  static sepia(imageData) {
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

  // 反色效果
  static invert(imageData) {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  // 复古效果
  static vintage(imageData) {
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
  static noise(imageData, amount) {
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
  static vignette(imageData, strength) {
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
}

// Worker消息处理
self.onmessage = function(e) {
  const { type, id, imageData, effect, params } = e.data
  
  if (type !== MESSAGE_TYPES.PROCESS_IMAGE) {
    return
  }
  
  try {
    let processedImageData
    
    switch (effect) {
      case 'brightness':
        processedImageData = ImageEffects.brightness(imageData, params.value || 0)
        break
      case 'contrast':
        processedImageData = ImageEffects.contrast(imageData, params.value || 0)
        break
      case 'saturate':
        processedImageData = ImageEffects.saturate(imageData, params.value || 0)
        break
      case 'hue-rotate':
        processedImageData = ImageEffects.hueRotate(imageData, params.angle || 0)
        break
      case 'blur':
        processedImageData = ImageEffects.blur(imageData, params.radius || 1)
        break
      case 'sharpen':
        processedImageData = ImageEffects.sharpen(imageData)
        break
      case 'emboss':
        processedImageData = ImageEffects.emboss(imageData)
        break
      case 'edge':
        processedImageData = ImageEffects.edgeDetection(imageData)
        break
      case 'grayscale':
        processedImageData = ImageEffects.grayscale(imageData)
        break
      case 'sepia':
        processedImageData = ImageEffects.sepia(imageData)
        break
      case 'invert':
        processedImageData = ImageEffects.invert(imageData)
        break
      case 'vintage':
        processedImageData = ImageEffects.vintage(imageData)
        break
      case 'noise':
        processedImageData = ImageEffects.noise(imageData, params.amount || 10)
        break
      case 'vignette':
        processedImageData = ImageEffects.vignette(imageData, params.strength || 0.5)
        break
      default:
        throw new Error(`Unknown effect: ${effect}`)
    }
    
    // 发送处理结果
    self.postMessage({
      type: MESSAGE_TYPES.IMAGE_PROCESSED,
      id: id,
      imageData: processedImageData,
      success: true
    })
    
  } catch (error) {
    // 发送错误信息
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      id: id,
      error: error.message,
      success: false
    })
  }
}