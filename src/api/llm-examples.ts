/**
 * LLM图像编辑使用示例
 * 展示如何使用AI接口进行图像编辑
 */

import { createLLMInterface } from './llm-bridge'
import { AICommand } from './ai-interface'

// 示例1: 基础图像编辑
export async function basicImageEditingExample() {
  const llm = createLLMInterface()
  
  console.log('=== 基础图像编辑示例 ===')
  
  // 1. 设置画布
  let result = await llm.execute('setCanvasSize', { width: 800, height: 600 })
  console.log('设置画布尺寸:', result.message)
  
  result = await llm.execute('setBackgroundColor', { color: '#f0f0f0' })
  console.log('设置背景色:', result.message)
  
  // 2. 创建图层
  result = await llm.execute('createLayer', { name: '主图层', type: 'vector' })
  console.log('创建图层:', result.message)
  
  // 3. 绘制形状
  result = await llm.execute('drawRectangle', {
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    options: {
      fill: '#ff6b6b',
      stroke: '#333',
      strokeWidth: 3
    }
  })
  console.log('绘制矩形:', result.message)
  
  result = await llm.execute('drawCircle', {
    x: 400,
    y: 200,
    radius: 80,
    options: {
      fill: '#4ecdc4',
      stroke: '#333',
      strokeWidth: 2
    }
  })
  console.log('绘制圆形:', result.message)
  
  // 4. 添加文本
  result = await llm.execute('addText', {
    text: 'AI Generated Art',
    x: 250,
    y: 400,
    options: {
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333',
      fontWeight: 'bold'
    }
  })
  console.log('添加文本:', result.message)
  
  // 5. 导出结果
  result = await llm.execute('exportCanvas', { format: 'png', quality: 1 })
  console.log('导出画布:', result.success ? '成功' : result.error)
  
  llm.destroy()
  return result.data?.dataURL
}

// 示例2: 批量操作
export async function batchOperationExample() {
  const llm = createLLMInterface()
  
  console.log('=== 批量操作示例 ===')
  
  const commands: AICommand[] = [
    {
      action: 'setCanvasSize',
      parameters: { width: 600, height: 400 },
      description: '设置画布尺寸'
    },
    {
      action: 'setBackgroundColor',
      parameters: { color: '#ffffff' },
      description: '设置白色背景'
    },
    {
      action: 'createLayer',
      parameters: { name: '图形层', type: 'vector' },
      description: '创建矢量图层'
    },
    {
      action: 'drawRectangle',
      parameters: {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        options: { fill: '#ff9999', stroke: '#cc0000', strokeWidth: 2 }
      },
      description: '绘制红色矩形'
    },
    {
      action: 'drawRectangle',
      parameters: {
        x: 200,
        y: 50,
        width: 100,
        height: 100,
        options: { fill: '#99ff99', stroke: '#00cc00', strokeWidth: 2 }
      },
      description: '绘制绿色矩形'
    },
    {
      action: 'drawRectangle',
      parameters: {
        x: 350,
        y: 50,
        width: 100,
        height: 100,
        options: { fill: '#9999ff', stroke: '#0000cc', strokeWidth: 2 }
      },
      description: '绘制蓝色矩形'
    }
  ]
  
  const results = await llm.executeBatch(commands)
  
  results.forEach((result, index) => {
    console.log(`命令 ${index + 1}: ${commands[index].description} - ${result.success ? '成功' : '失败'}`)
    if (!result.success) {
      console.error(`错误: ${result.error}`)
    }
  })
  
  llm.destroy()
  return results
}

// 示例3: 复杂图像编辑工作流
export async function complexWorkflowExample() {
  const llm = createLLMInterface()
  
  console.log('=== 复杂工作流示例 ===')
  
  try {
    // 1. 初始化画布
    await llm.execute('setCanvasSize', { width: 1000, height: 800 })
    await llm.execute('setBackgroundColor', { color: '#f8f9fa' })
    
    // 2. 创建多个图层
    const backgroundLayer = await llm.execute('createLayer', { name: '背景装饰', type: 'vector' })
    const mainLayer = await llm.execute('createLayer', { name: '主要内容', type: 'vector' })
    const textLayer = await llm.execute('createLayer', { name: '文本层', type: 'text' })
    
    // 3. 绘制背景装饰
    for (let i = 0; i < 5; i++) {
      await llm.execute('drawCircle', {
        x: Math.random() * 1000,
        y: Math.random() * 800,
        radius: 20 + Math.random() * 30,
        options: {
          fill: `hsla(${Math.random() * 360}, 70%, 80%, 0.3)`,
          stroke: 'none'
        }
      })
    }
    
    // 4. 绘制主要内容
    await llm.execute('drawRectangle', {
      x: 200,
      y: 200,
      width: 600,
      height: 400,
      options: {
        fill: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        stroke: '#333',
        strokeWidth: 3
      }
    })
    
    // 5. 添加标题文本
    await llm.execute('addText', {
      text: 'AI-Powered Design',
      x: 500,
      y: 300,
      options: {
        fontSize: 48,
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    })
    
    // 6. 添加副标题
    await llm.execute('addText', {
      text: 'Created with LLM Integration',
      x: 500,
      y: 450,
      options: {
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'normal'
      }
    })
    
    // 7. 获取最终状态
    const canvasState = await llm.execute('getCanvasState')
    const layerList = await llm.execute('getLayerList')
    
    console.log('画布状态:', canvasState.data)
    console.log('图层列表:', layerList.data)
    
    // 8. 导出最终结果
    const exportResult = await llm.execute('exportCanvas', { format: 'png', quality: 1 })
    
    llm.destroy()
    return {
      success: true,
      dataURL: exportResult.data?.dataURL,
      canvasState: canvasState.data,
      layers: layerList.data
    }
    
  } catch (error) {
    console.error('工作流执行失败:', error)
    llm.destroy()
    return { success: false, error: String(error) }
  }
}

// 示例4: 错误处理和恢复
export async function errorHandlingExample() {
  const llm = createLLMInterface()
  
  console.log('=== 错误处理示例 ===')
  
  // 1. 正常操作
  let result = await llm.execute('setCanvasSize', { width: 800, height: 600 })
  console.log('设置画布:', result.success)
  
  // 2. 故意触发错误 - 超出尺寸限制
  result = await llm.execute('setCanvasSize', { width: 10000, height: 10000 })
  console.log('超大画布设置:', result.success, result.error)
  
  // 3. 故意触发错误 - 无效图层ID
  result = await llm.execute('deleteLayer', { layerId: 'invalid-id' })
  console.log('删除无效图层:', result.success, result.error)
  
  // 4. 恢复操作
  result = await llm.execute('createLayer', { name: '恢复图层', type: 'raster' })
  console.log('创建恢复图层:', result.success)
  
  // 5. 使用撤销功能
  result = await llm.execute('undo')
  console.log('撤销操作:', result.success)
  
  result = await llm.execute('redo')
  console.log('重做操作:', result.success)
  
  llm.destroy()
}

// 示例5: 实时协作编辑
export async function collaborativeEditingExample() {
  console.log('=== 协作编辑示例 ===')
  
  // 模拟两个AI实例协作
  const ai1 = createLLMInterface()
  const ai2 = createLLMInterface()
  
  // AI1 初始化画布
  await ai1.execute('setCanvasSize', { width: 800, height: 600 })
  await ai1.execute('setBackgroundColor', { color: '#ffffff' })
  
  // AI1 创建左半部分
  await ai1.execute('createLayer', { name: 'AI1图层', type: 'vector' })
  await ai1.execute('drawRectangle', {
    x: 50,
    y: 100,
    width: 300,
    height: 200,
    options: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }
  })
  
  // AI2 创建右半部分
  await ai2.execute('createLayer', { name: 'AI2图层', type: 'vector' })
  await ai2.execute('drawCircle', {
    x: 600,
    y: 200,
    radius: 100,
    options: { fill: '#4ecdc4', stroke: '#333', strokeWidth: 2 }
  })
  
  // 获取最终状态
  const finalState = await ai1.execute('getLayerList')
  console.log('协作结果:', finalState.data)
  
  ai1.destroy()
  ai2.destroy()
}

// 导出所有示例
export const examples = {
  basicImageEditingExample,
  batchOperationExample,
  complexWorkflowExample,
  errorHandlingExample,
  collaborativeEditingExample
}

// 运行所有示例的函数
export async function runAllExamples() {
  console.log('🤖 开始运行LLM图像编辑示例...\n')
  
  try {
    await basicImageEditingExample()
    console.log('\n')
    
    await batchOperationExample()
    console.log('\n')
    
    await complexWorkflowExample()
    console.log('\n')
    
    await errorHandlingExample()
    console.log('\n')
    
    await collaborativeEditingExample()
    console.log('\n')
    
    console.log('✅ 所有示例运行完成!')
  } catch (error) {
    console.error('❌ 示例运行失败:', error)
  }
}