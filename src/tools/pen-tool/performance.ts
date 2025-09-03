/**
 * 渲染优化器 - 用于优化频繁的渲染操作
 */
export class RenderOptimizer {
  private renderQueue = new Set<() => void>()
  private isScheduled = false
  private lastRenderTime = 0
  private renderCount = 0

  /**
   * 调度渲染任务
   */
  scheduleRender(renderFn: () => void): void {
    this.renderQueue.add(renderFn)
    
    if (!this.isScheduled) {
      this.isScheduled = true
      requestAnimationFrame(() => {
        this.executeRenders()
      })
    }
  }

  /**
   * 执行所有排队的渲染任务
   */
  private executeRenders(): void {
    const now = performance.now()
    
    try {
      this.renderQueue.forEach(renderFn => {
        renderFn()
      })
      this.renderCount++
    } catch (error) {
      console.error('[RenderOptimizer] Render error:', error)
    } finally {
      this.renderQueue.clear()
      this.isScheduled = false
      this.lastRenderTime = now
    }
  }

  /**
   * 获取渲染统计信息
   */
  getStats() {
    return {
      renderCount: this.renderCount,
      lastRenderTime: this.lastRenderTime,
      queueSize: this.renderQueue.size,
      isScheduled: this.isScheduled,
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.renderCount = 0
    this.lastRenderTime = 0
  }
}

/**
 * 对象池 - 用于复用频繁创建的对象
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 50
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  /**
   * 获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  /**
   * 释放对象回池中
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  /**
   * 获取池状态
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      utilization: (this.maxSize - this.pool.length) / this.maxSize,
    }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = []
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: number | null = null
  
  return ((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }) as T
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let lastTime = 0
  
  return ((...args: any[]) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      return func(...args)
    }
  }) as T
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private maxSamples = 100

  /**
   * 开始性能测量
   */
  startMeasure(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordMetric(name, duration)
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const samples = this.metrics.get(name)!
    samples.push(value)
    
    // 保持样本数量在合理范围内
    if (samples.length > this.maxSamples) {
      samples.shift()
    }
  }

  /**
   * 获取性能统计
   */
  getStats(name: string) {
    const samples = this.metrics.get(name) || []
    
    if (samples.length === 0) {
      return null
    }
    
    const sum = samples.reduce((a, b) => a + b, 0)
    const avg = sum / samples.length
    const min = Math.min(...samples)
    const max = Math.max(...samples)
    
    return {
      count: samples.length,
      average: avg,
      min,
      max,
      total: sum,
    }
  }

  /**
   * 获取所有性能统计
   */
  getAllStats() {
    const stats: Record<string, any> = {}
    
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name)
    }
    
    return stats
  }

  /**
   * 清除指标
   */
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * 全局渲染优化器实例
 */
export const renderOptimizer = new RenderOptimizer()