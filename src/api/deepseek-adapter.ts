/**
 * DeepSeek LLM 适配器
 * 将自然语言转换为图像编辑API调用
 */

import OpenAI from 'openai'
import { createLLMInterface } from './llm-bridge'
import type { AICommand } from './ai-interface'

// DeepSeek配置接口
interface DeepSeekConfig {
  apiKey: string
  baseURL?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

// 默认配置
const DEFAULT_CONFIG: Partial<DeepSeekConfig> = {
  baseURL: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  maxTokens: 2000,
  temperature: 0.7
}

// 命令解析结果
interface ParsedCommands {
  success: boolean
  commands: AICommand[]
  explanation: string
  error?: string
}

/**
 * DeepSeek适配器类
 */
export class DeepSeekAdapter {
  private openai: OpenAI
  private llmInterface: ReturnType<typeof createLLMInterface>
  private config: DeepSeekConfig

  constructor(config: DeepSeekConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    this.openai = new OpenAI({
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey
    })
    
    this.llmInterface = createLLMInterface()
  }

  /**
   * 系统提示词 - 定义AI如何理解和转换用户指令
   */
  private getSystemPrompt(): string {
    return `你是一个专业的图像编辑AI助手，能够将用户的自然语言描述转换为具体的图像编辑API调用。

可用的API命令包括：

**画布操作：**
- setCanvasSize(width, height) - 设置画布尺寸
- setBackgroundColor(color) - 设置背景色
- getCanvasState() - 获取画布状态
- exportCanvas(format, quality) - 导出画布

**图层管理：**
- createLayer(name, type) - 创建图层 (type: 'raster'|'vector'|'text')
- deleteLayer(layerId) - 删除图层
- setLayerOpacity(layerId, opacity) - 设置透明度 (0-100)

**绘图操作：**
- drawRectangle(x, y, width, height, options) - 绘制矩形
- drawCircle(x, y, radius, options) - 绘制圆形
- addText(text, x, y, options) - 添加文本
- loadImage(imageUrl, x, y) - 加载图像

**选项参数：**
- fill: 填充色 (如 '#ff0000', 'red', 'transparent')
- stroke: 边框色
- strokeWidth: 边框宽度
- fontSize: 字体大小
- fontFamily: 字体 ('Arial', 'Times', etc.)
- fontWeight: 字体粗细 ('normal', 'bold')

**响应格式：**
请以JSON格式返回命令列表，格式如下：
{
  "explanation": "操作说明",
  "commands": [
    {
      "action": "命令名",
      "parameters": { 参数对象 },
      "description": "步骤描述"
    }
  ]
}

**示例：**
用户："创建一个800x600的画布，画一个红色圆形"
响应：
{
  "explanation": "创建画布并绘制红色圆形",
  "commands": [
    {
      "action": "setCanvasSize",
      "parameters": { "width": 800, "height": 600 },
      "description": "设置画布尺寸为800x600"
    },
    {
      "action": "drawCircle", 
      "parameters": { "x": 400, "y": 300, "radius": 100, "options": { "fill": "#ff0000", "stroke": "#000000", "strokeWidth": 2 }},
      "description": "在画布中心绘制红色圆形"
    }
  ]
}

请确保：
1. 坐标和尺寸合理（画布范围内）
2. 颜色格式正确（十六进制或颜色名）
3. 参数类型正确（数字、字符串、对象）
4. 操作顺序逻辑合理
5. 提供清晰的中文说明`
  }

  /**
   * 解析用户的自然语言指令
   */
  async parseNaturalLanguage(userInput: string): Promise<ParsedCommands> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: userInput }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        return {
          success: false,
          commands: [],
          explanation: '',
          error: 'DeepSeek返回空响应'
        }
      }

      // 解析JSON响应
      try {
        const parsed = JSON.parse(response)
        
        if (!parsed.commands || !Array.isArray(parsed.commands)) {
          return {
            success: false,
            commands: [],
            explanation: '',
            error: '响应格式不正确：缺少commands数组'
          }
        }

        return {
          success: true,
          commands: parsed.commands,
          explanation: parsed.explanation || '执行用户指令',
          error: undefined
        }
      } catch (parseError) {
        return {
          success: false,
          commands: [],
          explanation: '',
          error: `JSON解析失败: ${parseError}`
        }
      }

    } catch (error) {
      return {
        success: false,
        commands: [],
        explanation: '',
        error: `DeepSeek API调用失败: ${error}`
      }
    }
  }

  /**
   * 执行自然语言指令
   */
  async executeNaturalLanguage(userInput: string) {
    console.log(`🤖 DeepSeek处理指令: "${userInput}"`)
    
    // 1. 解析自然语言
    const parseResult = await this.parseNaturalLanguage(userInput)
    
    if (!parseResult.success) {
      return {
        success: false,
        message: `指令解析失败: ${parseResult.error}`,
        error: parseResult.error
      }
    }

    console.log(`📝 解析结果: ${parseResult.explanation}`)
    console.log(`🔧 生成命令数量: ${parseResult.commands.length}`)

    // 2. 执行API命令
    try {
      const results = await this.llmInterface.executeBatch(parseResult.commands)
      
      const failedResults = results.filter(r => !r.success)
      const successCount = results.length - failedResults.length

      if (failedResults.length === 0) {
        return {
          success: true,
          message: `✅ 成功执行 ${successCount} 个操作: ${parseResult.explanation}`,
          data: {
            explanation: parseResult.explanation,
            commandCount: results.length,
            results: results
          }
        }
      } else {
        return {
          success: false,
          message: `⚠️ 部分操作失败: ${successCount}/${results.length} 成功`,
          error: `失败的操作: ${failedResults.map(r => r.message).join(', ')}`,
          data: {
            explanation: parseResult.explanation,
            commandCount: results.length,
            results: results
          }
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `API执行失败: ${error}`,
        error: String(error)
      }
    }
  }

  /**
   * 获取建议的指令示例
   */
  getSuggestedPrompts(): string[] {
    return [
      "创建一个800x600的画布，背景设为浅蓝色",
      "画一个红色的圆形在画布中心",
      "添加文字'Hello AI'在坐标(200,100)位置",
      "创建一个简单的Logo：蓝色圆形背景，白色文字'AI Corp'",
      "画三个不同颜色的矩形，水平排列",
      "设计一个彩虹：画7个不同颜色的圆形弧线",
      "创建一个名片设计：白色背景，黑色边框，居中文字",
      "画一个简单的房子：矩形房身，三角形屋顶",
      "制作一个进度条：灰色背景，绿色填充50%",
      "设计一个简单的图标：圆形背景，加号符号"
    ]
  }

  /**
   * 销毁适配器
   */
  destroy() {
    this.llmInterface.destroy()
  }
}

/**
 * 创建DeepSeek适配器实例
 */
export function createDeepSeekAdapter(apiKey: string, config?: Partial<DeepSeekConfig>) {
  return new DeepSeekAdapter({
    apiKey,
    ...config
  })
}

/**
 * 全局DeepSeek适配器实例（需要API Key初始化）
 */
let globalAdapter: DeepSeekAdapter | null = null

export function initializeDeepSeek(apiKey: string, config?: Partial<DeepSeekConfig>) {
  globalAdapter = createDeepSeekAdapter(apiKey, config)
  return globalAdapter
}

export function getDeepSeekAdapter(): DeepSeekAdapter | null {
  return globalAdapter
}

export function destroyDeepSeek() {
  if (globalAdapter) {
    globalAdapter.destroy()
    globalAdapter = null
  }
}