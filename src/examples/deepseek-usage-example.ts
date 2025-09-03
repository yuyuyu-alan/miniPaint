/**
 * DeepSeek API使用示例
 * 展示如何处理真实的DeepSeek API响应
 */

// 基于您提供的真实API响应示例
const exampleDeepSeekResponse = {
    "id": "33d8a403-253a-4296-acac-910e135cbe0a",
    "object": "chat.completion",
    "created": 1756893804,
    "model": "deepseek-chat",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "{\n  \"explanation\": \"您好！我是一个专业的图像编辑AI助手，可以帮您创建和编辑图像。请告诉我您想要绘制什么内容，比如图形、文字或者设置画布等，我会生成相应的编辑命令。\",\n  \"commands\": []\n}"
            },
            "logprobs": null,
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 416,
        "completion_tokens": 55,
        "total_tokens": 471,
        "prompt_tokens_details": {
            "cached_tokens": 0
        },
        "prompt_cache_hit_tokens": 0,
        "prompt_cache_miss_tokens": 416
    },
    "system_fingerprint": "fp_feb633d1f5_prod0820_fp8_kvcache"
}

// 解析DeepSeek响应的函数
function parseDeepSeekResponse(response: any) {
    console.log('📦 收到DeepSeek响应:', response)
    
    // 提取消息内容
    const content = response.choices?.[0]?.message?.content
    if (!content) {
        throw new Error('DeepSeek响应中没有内容')
    }
    
    console.log('📝 AI回复内容:', content)
    
    // 解析JSON内容
    try {
        const parsed = JSON.parse(content)
        console.log('✅ JSON解析成功:', parsed)
        
        return {
            explanation: parsed.explanation || '执行AI指令',
            commands: parsed.commands || [],
            usage: response.usage,
            id: response.id
        }
    } catch (error) {
        console.error('❌ JSON解析失败:', error)
        throw new Error(`JSON解析失败: ${error}`)
    }
}

// 完整的DeepSeek API调用示例
async function callDeepSeekWithExample(apiKey: string, userPrompt: string) {
    console.log('🚀 开始调用DeepSeek API...')
    console.log('📝 用户指令:', userPrompt)
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的图像编辑AI助手，能够将用户的自然语言描述转换为具体的图像编辑API调用。

可用的API命令包括：

**画布操作：**
- setCanvasSize(width, height) - 设置画布尺寸
- setBackgroundColor(color) - 设置背景色

**绘图操作：**
- drawRectangle(x, y, width, height, options) - 绘制矩形
- drawCircle(x, y, radius, options) - 绘制圆形
- addText(text, x, y, options) - 添加文本

**响应格式要求：**
请严格按照以下JSON格式返回：
{
  "explanation": "对用户指令的理解和执行说明",
  "commands": [
    {
      "action": "API命令名称",
      "parameters": { "参数对象" },
      "description": "这一步的具体描述"
    }
  ]
}

**重要提示：**
1. 如果用户只是打招呼或询问功能，commands数组可以为空
2. 确保返回的是有效的JSON格式
3. 所有坐标和尺寸要合理
4. 颜色使用十六进制格式如#ff0000`
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API调用失败: ${response.status} ${response.statusText}\n${errorText}`)
        }

        const data = await response.json()
        console.log('📡 API响应状态:', response.status)
        console.log('💰 Token使用情况:', data.usage)
        
        // 解析响应
        const parsed = parseDeepSeekResponse(data)
        
        console.log('🎯 解析结果:')
        console.log('  说明:', parsed.explanation)
        console.log('  命令数量:', parsed.commands.length)
        
        if (parsed.commands.length > 0) {
            console.log('📋 生成的命令:')
            parsed.commands.forEach((cmd: any, index: number) => {
                console.log(`  ${index + 1}. ${cmd.action}: ${cmd.description}`)
                console.log(`     参数:`, cmd.parameters)
            })
        }
        
        return parsed
        
    } catch (error) {
        console.error('❌ DeepSeek API调用失败:', error)
        throw error
    }
}

// 测试不同类型的指令
async function testVariousPrompts(apiKey: string) {
    const testPrompts = [
        "你好，你能做什么？",
        "创建一个800x600的画布",
        "画一个红色圆形在画布中心",
        "添加文字'Hello DeepSeek'",
        "设计一个简单的Logo，公司名称'AI科技'"
    ]
    
    console.log('🧪 开始测试各种指令类型...\n')
    
    for (let i = 0; i < testPrompts.length; i++) {
        const prompt = testPrompts[i]
        console.log(`\n📝 测试 ${i + 1}/${testPrompts.length}: "${prompt}"`)
        console.log('=' .repeat(60))
        
        try {
            const result = await callDeepSeekWithExample(apiKey, prompt)
            
            if (result.commands.length === 0) {
                console.log('💬 这是一个对话回复，没有生成编辑命令')
            } else {
                console.log('✅ 成功生成编辑命令')
            }
            
        } catch (error) {
            console.error('❌ 测试失败:', error)
        }
        
        // 添加延迟避免API限制
        if (i < testPrompts.length - 1) {
            console.log('⏳ 等待2秒...')
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
}

// 处理特殊情况的示例
function handleSpecialCases() {
    console.log('🔧 处理特殊情况示例:')
    
    // 1. 空命令响应（如打招呼）
    const greetingResponse = {
        explanation: "您好！我是图像编辑AI助手，可以帮您创建和编辑图像。",
        commands: []
    }
    console.log('💬 打招呼响应:', greetingResponse)
    
    // 2. 复杂命令响应
    const complexResponse = {
        explanation: "创建Logo设计，包含背景圆形和公司名称",
        commands: [
            {
                action: "setCanvasSize",
                parameters: { width: 400, height: 400 },
                description: "设置Logo画布尺寸"
            },
            {
                action: "drawCircle",
                parameters: {
                    x: 200, y: 200, radius: 150,
                    options: { fill: "#667eea", stroke: "none" }
                },
                description: "绘制蓝色背景圆形"
            },
            {
                action: "addText",
                parameters: {
                    text: "AI科技",
                    x: 200, y: 200,
                    options: { fontSize: 32, fill: "#ffffff", fontWeight: "bold" }
                },
                description: "添加公司名称文字"
            }
        ]
    }
    console.log('🎨 复杂设计响应:', complexResponse)
}

// 浏览器环境使用
if (typeof window !== 'undefined') {
    (window as any).callDeepSeekWithExample = callDeepSeekWithExample;
    (window as any).testVariousPrompts = testVariousPrompts;
    (window as any).parseDeepSeekResponse = parseDeepSeekResponse;
    (window as any).handleSpecialCases = handleSpecialCases;
    
    console.log('💡 DeepSeek使用示例已加载！')
    console.log('在浏览器控制台中使用:')
    console.log('callDeepSeekWithExample("your-api-key", "创建一个画布")')
    console.log('testVariousPrompts("your-api-key")')
    console.log('handleSpecialCases()')
}

export {
    callDeepSeekWithExample,
    testVariousPrompts,
    parseDeepSeekResponse,
    handleSpecialCases
}