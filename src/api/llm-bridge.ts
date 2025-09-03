/**
 * LLM大模型桥接接口
 * 为大模型提供安全、标准化的图像编辑能力
 */

import { aiImageEditor, AIOperationResult, AICommand } from './ai-interface'

// 安全配置
interface SecurityConfig {
  maxCanvasSize: { width: number; height: number }
  maxLayerCount: number
  allowedImageDomains: string[]
  rateLimitPerMinute: number
  sessionTimeout: number
}

// 默认安全配置
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxCanvasSize: { width: 4096, height: 4096 },
  maxLayerCount: 50,
  allowedImageDomains: ['localhost', 'your-domain.com'],
  rateLimitPerMinute: 100,
  sessionTimeout: 30 * 60 * 1000 // 30分钟
}

// 操作日志
interface OperationLog {
  timestamp: number
  command: string
  parameters: any
  result: AIOperationResult
  sessionId: string
}

// LLM会话管理
interface LLMSession {
  id: string
  startTime: number
  lastActivity: number
  operationCount: number
  operationLogs: OperationLog[]
}

/**
 * LLM桥接器类
 * 提供安全的AI图像编辑接口
 */
export class LLMBridge {
  private static instance: LLMBridge
  private sessions: Map<string, LLMSession> = new Map()
  private securityConfig: SecurityConfig
  private operationCounts: Map<string, number> = new Map()

  constructor(config?: Partial<SecurityConfig>) {
    this.securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config }
    this.startCleanupTimer()
  }

  public static getInstance(config?: Partial<SecurityConfig>): LLMBridge {
    if (!LLMBridge.instance) {
      LLMBridge.instance = new LLMBridge(config)
    }
    return LLMBridge.instance
  }

  /**
   * 创建新的LLM会话
   */
  createSession(): string {
    const sessionId = 'llm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const session: LLMSession = {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      operationCount: 0,
      operationLogs: []
    }
    
    this.sessions.set(sessionId, session)
    return sessionId
  }

  /**
   * 验证会话有效性
   */
  private validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    
    const now = Date.now()
    if (now - session.lastActivity > this.securityConfig.sessionTimeout) {
      this.sessions.delete(sessionId)
      return false
    }
    
    return true
  }

  /**
   * 检查操作频率限制
   */
  private checkRateLimit(sessionId: string): boolean {
    const now = Date.now()
    const key = `${sessionId}_${Math.floor(now / 60000)}` // 按分钟分组
    const count = this.operationCounts.get(key) || 0
    
    if (count >= this.securityConfig.rateLimitPerMinute) {
      return false
    }
    
    this.operationCounts.set(key, count + 1)
    return true
  }

  /**
   * 验证参数安全性
   */
  private validateParameters(command: string, parameters: any): { valid: boolean; error?: string } {
    switch (command) {
      case 'setCanvasSize':
        const { width, height } = parameters
        if (width > this.securityConfig.maxCanvasSize.width || 
            height > this.securityConfig.maxCanvasSize.height) {
          return {
            valid: false,
            error: `画布尺寸超出限制 (最大: ${this.securityConfig.maxCanvasSize.width}x${this.securityConfig.maxCanvasSize.height})`
          }
        }
        break
        
      case 'loadImage':
        const { imageUrl } = parameters
        if (!this.isAllowedImageUrl(imageUrl)) {
          return {
            valid: false,
            error: '不允许的图像域名'
          }
        }
        break
        
      case 'createLayer':
        // 检查图层数量限制
        // 这里需要从store获取当前图层数量
        break
    }
    
    return { valid: true }
  }

  /**
   * 检查图像URL是否允许
   */
  private isAllowedImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return this.securityConfig.allowedImageDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      )
    } catch {
      return false
    }
  }

  /**
   * 记录操作日志
   */
  private logOperation(sessionId: string, command: string, parameters: any, result: AIOperationResult) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const log: OperationLog = {
      timestamp: Date.now(),
      command,
      parameters,
      result,
      sessionId
    }

    session.operationLogs.push(log)
    session.lastActivity = Date.now()
    session.operationCount++

    // 限制日志数量
    if (session.operationLogs.length > 1000) {
      session.operationLogs = session.operationLogs.slice(-500)
    }
  }

  /**
   * 执行AI命令 - 主要接口
   */
  async executeCommand(sessionId: string, command: string, parameters: any = {}): Promise<AIOperationResult> {
    // 1. 验证会话
    if (!this.validateSession(sessionId)) {
      return {
        success: false,
        message: '会话无效或已过期',
        error: 'Invalid or expired session'
      }
    }

    // 2. 检查频率限制
    if (!this.checkRateLimit(sessionId)) {
      return {
        success: false,
        message: '操作频率过高，请稍后再试',
        error: 'Rate limit exceeded'
      }
    }

    // 3. 验证参数安全性
    const validation = this.validateParameters(command, parameters)
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || '参数验证失败',
        error: 'Parameter validation failed'
      }
    }

    // 4. 执行命令
    let result: AIOperationResult
    try {
      switch (command) {
        // 画布操作
        case 'setCanvasSize':
          result = await aiImageEditor.setCanvasSize(parameters.width, parameters.height)
          break
        case 'setBackgroundColor':
          result = await aiImageEditor.setBackgroundColor(parameters.color)
          break

        // 图层操作
        case 'createLayer':
          result = await aiImageEditor.createLayer(parameters.name, parameters.type)
          break
        case 'deleteLayer':
          result = await aiImageEditor.deleteLayer(parameters.layerId)
          break
        case 'setLayerOpacity':
          result = await aiImageEditor.setLayerOpacity(parameters.layerId, parameters.opacity)
          break

        // 工具操作
        case 'switchTool':
          result = await aiImageEditor.switchTool(parameters.toolType)
          break
        case 'setToolSettings':
          result = await aiImageEditor.setToolSettings(parameters.toolType, parameters.settings)
          break

        // 绘图操作
        case 'drawRectangle':
          result = await aiImageEditor.drawRectangle(
            parameters.x, parameters.y, parameters.width, parameters.height, parameters.options
          )
          break
        case 'drawCircle':
          result = await aiImageEditor.drawCircle(
            parameters.x, parameters.y, parameters.radius, parameters.options
          )
          break
        case 'addText':
          result = await aiImageEditor.addText(
            parameters.text, parameters.x, parameters.y, parameters.options
          )
          break
        case 'loadImage':
          result = await aiImageEditor.loadImage(parameters.imageUrl, parameters.x, parameters.y)
          break

        // 历史操作
        case 'undo':
          result = await aiImageEditor.undo()
          break
        case 'redo':
          result = await aiImageEditor.redo()
          break

        // 状态查询
        case 'getCanvasState':
          result = await aiImageEditor.getCanvasState()
          break
        case 'getLayerList':
          result = await aiImageEditor.getLayerList()
          break
        case 'exportCanvas':
          result = await aiImageEditor.exportCanvas(parameters.format, parameters.quality)
          break

        default:
          result = {
            success: false,
            message: `未知命令: ${command}`,
            error: 'Unknown command'
          }
      }
    } catch (error) {
      result = {
        success: false,
        message: '命令执行失败',
        error: String(error)
      }
    }

    // 5. 记录操作日志
    this.logOperation(sessionId, command, parameters, result)

    return result
  }

  /**
   * 批量执行命令
   */
  async executeBatch(sessionId: string, commands: AICommand[]): Promise<AIOperationResult[]> {
    const results: AIOperationResult[] = []
    
    for (const command of commands) {
      const result = await this.executeCommand(sessionId, command.action, command.parameters)
      results.push(result)
      
      // 如果某个命令失败，可以选择继续或停止
      if (!result.success) {
        console.warn(`Command ${command.action} failed:`, result.error)
      }
    }
    
    return results
  }

  /**
   * 获取会话信息
   */
  getSessionInfo(sessionId: string): LLMSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * 获取操作历史
   */
  getOperationHistory(sessionId: string, limit: number = 50): OperationLog[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    
    return session.operationLogs.slice(-limit)
  }

  /**
   * 清理过期会话
   */
  private startCleanupTimer() {
    setInterval(() => {
      const now = Date.now()
      
      // 清理过期会话
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity > this.securityConfig.sessionTimeout) {
          this.sessions.delete(sessionId)
        }
      }
      
      // 清理过期的操作计数
      for (const [key] of this.operationCounts.entries()) {
        const timestamp = parseInt(key.split('_').pop() || '0') * 60000
        if (now - timestamp > 60000) { // 1分钟前的计数
          this.operationCounts.delete(key)
        }
      }
    }, 60000) // 每分钟清理一次
  }

  /**
   * 销毁会话
   */
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    activeSessions: number
    totalOperations: number
    averageOperationsPerSession: number
  } {
    const activeSessions = this.sessions.size
    const totalOperations = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.operationCount, 0)
    
    return {
      activeSessions,
      totalOperations,
      averageOperationsPerSession: activeSessions > 0 ? totalOperations / activeSessions : 0
    }
  }
}

// 导出单例实例
export const llmBridge = LLMBridge.getInstance()

// 为LLM提供的简化调用接口
export class SimpleLLMInterface {
  private sessionId: string
  private bridge: LLMBridge

  constructor(config?: Partial<SecurityConfig>) {
    this.bridge = LLMBridge.getInstance(config)
    this.sessionId = this.bridge.createSession()
  }

  /**
   * 执行单个命令
   */
  async execute(command: string, parameters: any = {}): Promise<AIOperationResult> {
    return this.bridge.executeCommand(this.sessionId, command, parameters)
  }

  /**
   * 执行多个命令
   */
  async executeBatch(commands: AICommand[]): Promise<AIOperationResult[]> {
    return this.bridge.executeBatch(this.sessionId, commands)
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 销毁会话
   */
  destroy(): void {
    this.bridge.destroySession(this.sessionId)
  }
}

// 使用示例
export const createLLMInterface = (config?: Partial<SecurityConfig>) => {
  return new SimpleLLMInterface(config)
}