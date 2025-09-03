/**
 * DeepSeek API测试脚本
 * 用于验证DeepSeek集成是否正常工作
 */

// 测试DeepSeek API调用
async function testDeepSeekAPI(apiKey: string, testPrompt: string = "创建一个800x600的画布，画一个红色圆形") {
  console.log('🧪 开始测试DeepSeek API...')
  console.log(`📝 测试指令: "${testPrompt}"`)
  
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

**响应格式：**
请以JSON格式返回命令列表：
{
  "explanation": "操作说明",
  "commands": [
    {
      "action": "命令名",
      "parameters": { 参数对象 },
      "description": "步骤描述"
    }
  ]
}`
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    console.log(`📡 API响应状态: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API调用失败: ${response.status} ${response.statusText}`)
      console.error(`错误详情: ${errorText}`)
      return false
    }

    const data = await response.json()
    console.log('📦 API响应数据:', JSON.stringify(data, null, 2))

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('❌ API返回空内容')
      return false
    }

    console.log('🤖 DeepSeek响应:', content)

    // 尝试解析JSON
    try {
      const parsed = JSON.parse(content)
      console.log('✅ JSON解析成功:', parsed)
      
      if (parsed.commands && Array.isArray(parsed.commands)) {
        console.log(`📋 生成了 ${parsed.commands.length} 个命令:`)
        parsed.commands.forEach((cmd: any, index: number) => {
          console.log(`  ${index + 1}. ${cmd.action}: ${cmd.description}`)
        })
        return true
      } else {
        console.error('❌ 响应格式不正确：缺少commands数组')
        return false
      }
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError)
      console.log('原始内容:', content)
      return false
    }

  } catch (error) {
    console.error('❌ 网络请求失败:', error)
    return false
  }
}

// 测试多个指令
async function runDeepSeekTests(apiKey: string) {
  console.log('🚀 开始DeepSeek完整测试...\n')
  
  const testCases = [
    "创建一个800x600的画布，画一个红色圆形",
    "设计一个Logo，公司名称'AI科技'",
    "画三个不同颜色的矩形，水平排列",
    "添加文字'Hello DeepSeek'在坐标(200,100)",
    "制作一个简单的名片设计"
  ]

  let successCount = 0
  
  for (let i = 0; i < testCases.length; i++) {
    console.log(`\n📝 测试 ${i + 1}/${testCases.length}: ${testCases[i]}`)
    console.log('=' .repeat(50))
    
    const success = await testDeepSeekAPI(apiKey, testCases[i])
    if (success) {
      successCount++
      console.log('✅ 测试通过')
    } else {
      console.log('❌ 测试失败')
    }
    
    // 添加延迟避免API限制
    if (i < testCases.length - 1) {
      console.log('⏳ 等待2秒...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 测试结果汇总:')
  console.log(`总测试数: ${testCases.length}`)
  console.log(`成功数: ${successCount}`)
  console.log(`失败数: ${testCases.length - successCount}`)
  console.log(`成功率: ${((successCount / testCases.length) * 100).toFixed(1)}%`)
  
  if (successCount === testCases.length) {
    console.log('🎉 所有测试通过！DeepSeek集成正常工作！')
  } else {
    console.log('⚠️ 部分测试失败，请检查API Key和网络连接')
  }
  
  return successCount === testCases.length
}

// 浏览器环境使用
if (typeof window !== 'undefined') {
  (window as any).testDeepSeekAPI = testDeepSeekAPI;
  (window as any).runDeepSeekTests = runDeepSeekTests;
  
  console.log('💡 在浏览器控制台中使用:')
  console.log('testDeepSeekAPI("your-api-key", "你的测试指令")')
  console.log('runDeepSeekTests("your-api-key")')
}

export { testDeepSeekAPI, runDeepSeekTests }