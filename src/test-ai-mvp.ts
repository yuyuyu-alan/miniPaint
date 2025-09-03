/**
 * AI图像编辑MVP快速测试脚本
 * 用于验证核心功能是否正常工作
 */

import { aiImageEditor } from './api/ai-interface'
import { createLLMInterface } from './api/llm-bridge'

// 测试结果接口
interface TestResult {
  testName: string
  success: boolean
  message: string
  duration: number
}

class AITestRunner {
  private results: TestResult[] = []

  async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      const duration = Date.now() - startTime
      this.results.push({
        testName,
        success: true,
        message: '✅ 测试通过',
        duration
      })
      console.log(`✅ ${testName} - 通过 (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.push({
        testName,
        success: false,
        message: `❌ 测试失败: ${error}`,
        duration
      })
      console.error(`❌ ${testName} - 失败 (${duration}ms):`, error)
    }
  }

  getResults(): TestResult[] {
    return this.results
  }

  getSummary(): { total: number; passed: number; failed: number; totalTime: number } {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)
    
    return { total, passed, failed, totalTime }
  }
}

// 核心API测试
async function testCoreAPI() {
  console.log('🧪 开始核心API测试...\n')
  
  const runner = new AITestRunner()

  // 测试1: 画布操作
  await runner.runTest('画布尺寸设置', async () => {
    const result = await aiImageEditor.setCanvasSize(800, 600)
    if (!result.success) throw new Error(result.error)
  })

  await runner.runTest('背景色设置', async () => {
    const result = await aiImageEditor.setBackgroundColor('#f0f8ff')
    if (!result.success) throw new Error(result.error)
  })

  // 测试2: 图层操作
  await runner.runTest('创建图层', async () => {
    const result = await aiImageEditor.createLayer('测试图层', 'vector')
    if (!result.success) throw new Error(result.error)
  })

  // 测试3: 绘图操作
  await runner.runTest('绘制矩形', async () => {
    const result = await aiImageEditor.drawRectangle(100, 100, 200, 150, {
      fill: '#ff6b6b',
      stroke: '#333333',
      strokeWidth: 2
    })
    if (!result.success) throw new Error(result.error)
  })

  await runner.runTest('绘制圆形', async () => {
    const result = await aiImageEditor.drawCircle(400, 200, 80, {
      fill: '#4ecdc4',
      stroke: '#333333',
      strokeWidth: 2
    })
    if (!result.success) throw new Error(result.error)
  })

  await runner.runTest('添加文本', async () => {
    const result = await aiImageEditor.addText('AI Test', 300, 400, {
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
      fontWeight: 'bold'
    })
    if (!result.success) throw new Error(result.error)
  })

  // 测试4: 状态查询
  await runner.runTest('获取画布状态', async () => {
    const result = await aiImageEditor.getCanvasState()
    if (!result.success) throw new Error(result.error)
    if (!result.data || !result.data.width) throw new Error('画布状态数据不完整')
  })

  await runner.runTest('获取图层列表', async () => {
    const result = await aiImageEditor.getLayerList()
    if (!result.success) throw new Error(result.error)
    if (!result.data || !Array.isArray(result.data.layers)) throw new Error('图层列表数据不完整')
  })

  // 测试5: 导出功能
  await runner.runTest('导出画布', async () => {
    const result = await aiImageEditor.exportCanvas('png', 1)
    if (!result.success) throw new Error(result.error)
    if (!result.data || !result.data.dataURL) throw new Error('导出数据不完整')
  })

  return runner
}

// LLM桥接测试
async function testLLMBridge() {
  console.log('\n🤖 开始LLM桥接测试...\n')
  
  const runner = new AITestRunner()
  const llm = createLLMInterface()

  // 测试1: 单个命令执行
  await runner.runTest('LLM单命令执行', async () => {
    const result = await llm.execute('setCanvasSize', { width: 600, height: 400 })
    if (!result.success) throw new Error(result.error)
  })

  // 测试2: 批量命令执行
  await runner.runTest('LLM批量命令执行', async () => {
    const results = await llm.executeBatch([
      {
        action: 'setBackgroundColor',
        parameters: { color: '#ffffff' }
      },
      {
        action: 'createLayer',
        parameters: { name: 'LLM图层', type: 'vector' }
      },
      {
        action: 'drawRectangle',
        parameters: {
          x: 50, y: 50, width: 100, height: 100,
          options: { fill: '#ff9999', stroke: '#cc0000', strokeWidth: 2 }
        }
      }
    ])
    
    const failedResults = results.filter(r => !r.success)
    if (failedResults.length > 0) {
      throw new Error(`批量操作中有 ${failedResults.length} 个命令失败`)
    }
  })

  // 测试3: 错误处理
  await runner.runTest('LLM错误处理', async () => {
    const result = await llm.execute('invalidCommand', {})
    if (result.success) throw new Error('应该返回错误但却成功了')
    // 错误处理正常，测试通过
  })

  llm.destroy()
  return runner
}

// 复杂场景测试
async function testComplexScenario() {
  console.log('\n🎨 开始复杂场景测试...\n')
  
  const runner = new AITestRunner()
  const llm = createLLMInterface()

  await runner.runTest('Logo设计场景', async () => {
    // 模拟完整的Logo设计流程
    const steps = [
      { action: 'setCanvasSize', parameters: { width: 400, height: 400 }},
      { action: 'setBackgroundColor', parameters: { color: '#f8f9fa' }},
      { action: 'createLayer', parameters: { name: 'Logo背景', type: 'vector' }},
      { action: 'drawCircle', parameters: { 
        x: 200, y: 200, radius: 150,
        options: { fill: '#667eea', stroke: 'none' }
      }},
      { action: 'addText', parameters: {
        text: 'AI Corp',
        x: 200, y: 180,
        options: { fontSize: 32, fill: '#ffffff', fontWeight: 'bold' }
      }},
      { action: 'addText', parameters: {
        text: 'Future of Design',
        x: 200, y: 220,
        options: { fontSize: 14, fill: '#ffffff', fontWeight: 'normal' }
      }}
    ]

    const results = await llm.executeBatch(steps)
    const failedResults = results.filter(r => !r.success)
    if (failedResults.length > 0) {
      throw new Error(`Logo设计流程中有 ${failedResults.length} 个步骤失败`)
    }

    // 验证最终状态
    const canvasState = await llm.execute('getCanvasState')
    if (!canvasState.success) throw new Error('无法获取画布状态')

    const layerList = await llm.execute('getLayerList')
    if (!layerList.success) throw new Error('无法获取图层列表')

    // 导出最终结果
    const exportResult = await llm.execute('exportCanvas', { format: 'png', quality: 1 })
    if (!exportResult.success) throw new Error('无法导出画布')
  })

  llm.destroy()
  return runner
}

// 性能测试
async function testPerformance() {
  console.log('\n⚡ 开始性能测试...\n')
  
  const runner = new AITestRunner()

  await runner.runTest('API响应时间测试', async () => {
    const startTime = Date.now()
    const promises = []
    
    // 并发执行10个API调用
    for (let i = 0; i < 10; i++) {
      promises.push(aiImageEditor.drawRectangle(i * 50, i * 50, 40, 40, {
        fill: `hsl(${i * 36}, 70%, 50%)`,
        stroke: '#333',
        strokeWidth: 1
      }))
    }
    
    const results = await Promise.all(promises)
    const duration = Date.now() - startTime
    
    const failedResults = results.filter(r => !r.success)
    if (failedResults.length > 0) {
      throw new Error(`${failedResults.length} 个并发调用失败`)
    }
    
    if (duration > 2000) {
      throw new Error(`并发性能不达标: ${duration}ms > 2000ms`)
    }
    
    console.log(`  📊 10个并发API调用耗时: ${duration}ms`)
  })

  await runner.runTest('批量操作性能测试', async () => {
    const llm = createLLMInterface()
    const startTime = Date.now()
    
    // 创建20个绘图命令
    const commands = []
    for (let i = 0; i < 20; i++) {
      commands.push({
        action: 'drawCircle',
        parameters: {
          x: Math.random() * 400,
          y: Math.random() * 400,
          radius: 10 + Math.random() * 20,
          options: {
            fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
            stroke: 'none'
          }
        }
      })
    }
    
    const results = await llm.executeBatch(commands)
    const duration = Date.now() - startTime
    
    const failedResults = results.filter(r => !r.success)
    if (failedResults.length > 0) {
      throw new Error(`${failedResults.length} 个批量命令失败`)
    }
    
    if (duration > 3000) {
      throw new Error(`批量操作性能不达标: ${duration}ms > 3000ms`)
    }
    
    console.log(`  📊 20个批量命令耗时: ${duration}ms`)
    llm.destroy()
  })

  return runner
}

// 主测试函数
export async function runAIMVPTests() {
  console.log('🚀 开始AI图像编辑MVP测试\n')
  console.log('=' .repeat(50))
  
  const allRunners: AITestRunner[] = []
  
  try {
    // 运行所有测试
    allRunners.push(await testCoreAPI())
    allRunners.push(await testLLMBridge())
    allRunners.push(await testComplexScenario())
    allRunners.push(await testPerformance())
    
    // 汇总结果
    console.log('\n' + '='.repeat(50))
    console.log('📊 测试结果汇总\n')
    
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalTime = 0
    
    allRunners.forEach((runner, index) => {
      const summary = runner.getSummary()
      totalTests += summary.total
      totalPassed += summary.passed
      totalFailed += summary.failed
      totalTime += summary.totalTime
      
      const testSuites = ['核心API', 'LLM桥接', '复杂场景', '性能测试']
      console.log(`${testSuites[index]}测试: ${summary.passed}/${summary.total} 通过 (${summary.totalTime}ms)`)
    })
    
    console.log('\n总体结果:')
    console.log(`  总测试数: ${totalTests}`)
    console.log(`  通过数: ${totalPassed}`)
    console.log(`  失败数: ${totalFailed}`)
    console.log(`  总耗时: ${totalTime}ms`)
    console.log(`  成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`)
    
    if (totalFailed === 0) {
      console.log('\n🎉 所有测试通过！AI图像编辑MVP功能正常！')
      return true
    } else {
      console.log(`\n⚠️  有 ${totalFailed} 个测试失败，请检查相关功能`)
      return false
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生严重错误:', error)
    return false
  }
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).runAIMVPTests = runAIMVPTests
  console.log('💡 在浏览器控制台中运行: runAIMVPTests()')
}

// 导出测试函数供其他模块使用
export default runAIMVPTests