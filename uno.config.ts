import { defineConfig, presetAttributify, presetIcons } from 'unocss'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default as any),
      }
    })
  ],
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      canvas: {
        bg: '#f8fafc',
        grid: '#e2e8f0',
      }
    }
  },
  shortcuts: {
    // 按钮样式
    'btn': 'px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer select-none',
    'btn-secondary': 'px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors cursor-pointer select-none',
    'btn-ghost': 'px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer select-none',
    
    // 工具按钮
    'tool-btn': 'w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer',
    'tool-btn-active': 'w-10 h-10 flex items-center justify-center rounded-md bg-primary-100 text-primary-700 border-2 border-primary-300',
    
    // 面板样式
    'panel': 'bg-white border border-gray-200 rounded-lg shadow-sm',
    'panel-header': 'flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg',
    'panel-content': 'p-3',
    
    // 布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'app-layout': 'flex flex-col h-screen bg-gray-50',
    'main-content': 'flex flex-1 overflow-hidden',
    
    // 画布相关
    'canvas-container': 'flex-1 relative overflow-hidden bg-canvas-bg',
    'canvas-overlay': 'absolute inset-0 pointer-events-none',
    
    // 输入控件
    'input-base': 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'slider-base': 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
  }
})