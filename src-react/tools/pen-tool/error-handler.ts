import { PEN_TOOL_MESSAGES } from './config'

/**
 * 钢笔工具错误类型
 */
export enum PenToolErrorType {
  CANVAS_ERROR = 'CANVAS_ERROR',
  RENDER_ERROR = 'RENDER_ERROR', 
  STATE_ERROR = 'STATE_ERROR',
  PATH_ERROR = 'PATH_ERROR',
}

/**
 * 钢笔工具自定义错误类
 */
export class PenToolError extends Error {
  constructor(
    public type: PenToolErrorType,
    message: string,
    public context?: any
  ) {
    super(message)
    this.name = 'PenToolError'
  }
}

/**
 * 错误处理器类
 */
export class PenToolErrorHandler {
  private errorCount = 0
  private maxErrors = 10
  private errorHistory: Array<{ error: Error; timestamp: number; context?: any }> = []

  /**
   * 处理错误
   */
  handleError(error: Error, context?: string, additionalContext?: any): void {
    this.errorCount++
    
    // 记录错误历史
    this.errorHistory.push({
      error,
      timestamp: Date.now(),
      context: { context, ...additionalContext }
    })

    // 保持错误历史在合理范围内
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-25)
    }

    // 控制台输出详细错误信息
    console.error(`[PenTool Error] ${context || 'Unknown context'}:`, {
      error: error.message,
      stack: error.stack,
      context: additionalContext,
      errorCount: this.errorCount
    })

    // 如果错误过多，可能需要重置工具状态
    if (this.errorCount > this.maxErrors) {
      console.warn('[PenTool] Too many errors, consider resetting tool state')
      this.errorCount = 0
    }
  }

  /**
   * 创建错误处理装饰器
   */
  withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    context: string
  ): T {
    return ((...args: any[]) => {
      try {
        return fn.apply(this, args)
      } catch (error) {
        this.handleError(error as Error, context, { args })
        return null
      }
    }) as T
  }

  /**
   * 异步错误处理装饰器
   */
  withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn.apply(this, args)
      } catch (error) {
        this.handleError(error as Error, context, { args })
        return null
      }
    }) as T
  }

  /**
   * 验证画布状态
   */
  validateCanvas(canvas: any): void {
    if (!canvas) {
      throw new PenToolError(
        PenToolErrorType.CANVAS_ERROR,
        PEN_TOOL_MESSAGES.ERRORS.CANVAS_NOT_INITIALIZED
      )
    }
  }

  /**
   * 验证点数据
   */
  validatePoint(point: any): void {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      throw new PenToolError(
        PenToolErrorType.PATH_ERROR,
        PEN_TOOL_MESSAGES.ERRORS.INVALID_POINT_DATA,
        { point }
      )
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorHistory.slice(-10),
      errorsByType: this.errorHistory.reduce((acc, { error }) => {
        const type = error instanceof PenToolError ? error.type : 'UNKNOWN'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * 重置错误计数
   */
  resetErrorCount(): void {
    this.errorCount = 0
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = []
    this.errorCount = 0
  }
}

/**
 * 全局错误处理器实例
 */
export const penToolErrorHandler = new PenToolErrorHandler()