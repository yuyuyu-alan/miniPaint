import { useCallback, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import * as fabric from 'fabric'

interface FileDropOptions {
  acceptedTypes?: string[]
  maxFileSize?: number // MB
  onFileAccepted?: (file: File) => void
  onFileRejected?: (file: File, reason: string) => void
  onImportComplete?: (success: boolean) => void
}

export const useFileDrop = (options: FileDropOptions = {}) => {
  const {
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxFileSize = 10, // 10MB
    onFileAccepted,
    onFileRejected,
    onImportComplete
  } = options

  const { fabricCanvas } = useCanvasStore()
  const { saveState } = useHistoryStore()
  const dragCounterRef = useRef(0)

  // 验证文件
  const validateFile = useCallback((file: File): { valid: boolean; reason?: string } => {
    // 检查文件类型
    if (!acceptedTypes.includes(file.type)) {
      return { valid: false, reason: `不支持的文件类型: ${file.type}` }
    }

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      return { valid: false, reason: `文件过大: ${fileSizeMB.toFixed(1)}MB (最大${maxFileSize}MB)` }
    }

    return { valid: true }
  }, [acceptedTypes, maxFileSize])

  // 处理文件导入
  const importFile = useCallback(async (file: File): Promise<boolean> => {
    if (!fabricCanvas) return false

    const validation = validateFile(file)
    if (!validation.valid) {
      onFileRejected?.(file, validation.reason || '文件验证失败')
      return false
    }

    try {
      onFileAccepted?.(file)

      // 读取文件
      const dataUrl = await readFileAsDataURL(file)
      
      // 创建图像对象
      const img = await createFabricImage(dataUrl)
      
      // 添加到画布
      fabricCanvas.add(img)
      fabricCanvas.setActiveObject(img)
      fabricCanvas.renderAll()
      
      // 保存历史状态
      saveState(`导入文件: ${file.name}`)
      
      onImportComplete?.(true)
      return true
    } catch (error) {
      console.error('File import failed:', error)
      onFileRejected?.(file, `导入失败: ${error}`)
      onImportComplete?.(false)
      return false
    }
  }, [fabricCanvas, saveState, validateFile, onFileAccepted, onFileRejected, onImportComplete])

  // 读取文件为DataURL
  const readFileAsDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('File reading error'))
      reader.readAsDataURL(file)
    })
  }, [])

  // 创建Fabric图像对象
  const createFabricImage = useCallback((dataUrl: string): Promise<fabric.Image> => {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(dataUrl, {
        crossOrigin: 'anonymous'
      }).then((img: fabric.Image) => {
        // 设置图像位置和大小
        const canvasWidth = fabricCanvas?.width || 800
        const canvasHeight = fabricCanvas?.height || 600
        
        // 计算合适的缩放比例
        const maxWidth = canvasWidth * 0.8
        const maxHeight = canvasHeight * 0.8
        
        const scaleX = img.width! > maxWidth ? maxWidth / img.width! : 1
        const scaleY = img.height! > maxHeight ? maxHeight / img.height! : 1
        const scale = Math.min(scaleX, scaleY)
        
        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale
        })
        
        resolve(img)
      }).catch((error) => {
        reject(new Error('Failed to create fabric image: ' + error))
      })
    })
  }, [fabricCanvas])

  // 拖拽事件处理器
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer?.files || [])
    
    if (files.length === 0) return

    // 处理多个文件
    for (const file of files) {
      await importFile(file)
    }
  }, [importFile])

  // 绑定拖拽事件到元素
  const bindDropZone = useCallback((element: HTMLElement | null) => {
    if (!element) return

    element.addEventListener('dragenter', handleDragEnter)
    element.addEventListener('dragleave', handleDragLeave)
    element.addEventListener('dragover', handleDragOver)
    element.addEventListener('drop', handleDrop)

    // 返回清理函数
    return () => {
      element.removeEventListener('dragenter', handleDragEnter)
      element.removeEventListener('dragleave', handleDragLeave)
      element.removeEventListener('dragover', handleDragOver)
      element.removeEventListener('drop', handleDrop)
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  // 程序化导入文件
  const importFiles = useCallback(async (files: FileList | File[]): Promise<boolean[]> => {
    const fileArray = Array.from(files)
    const results: boolean[] = []
    
    for (const file of fileArray) {
      const result = await importFile(file)
      results.push(result)
    }
    
    return results
  }, [importFile])

  return {
    // 方法
    importFile,
    importFiles,
    bindDropZone,
    validateFile,
    
    // 事件处理器
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    
    // 状态
    isDragging: dragCounterRef.current > 0
  }
}