import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UIState, ColorState } from '@/types'

interface UIStore extends UIState {
  // UI 状态操作
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // 面板显示控制
  togglePanel: (panel: keyof UIState['panelVisibility']) => void
  setPanelVisibility: (panel: keyof UIState['panelVisibility'], visible: boolean) => void
  
  // 模态框控制
  openModal: (modalId: string) => void
  closeModal: () => void
  
  // 颜色管理
  colors: ColorState
  setPrimaryColor: (color: string) => void
  setSecondaryColor: (color: string) => void
  addToSwatches: (color: string) => void
  addToRecentColors: (color: string) => void
  removeFromSwatches: (color: string) => void
  clearSwatches: () => void
  
  // 布局相关
  windowSize: { width: number; height: number }
  setWindowSize: (size: { width: number; height: number }) => void
  
  // 键盘快捷键状态
  keyPressed: Set<string>
  setKeyPressed: (key: string, pressed: boolean) => void
  isKeyPressed: (key: string) => boolean
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // 初始 UI 状态
      theme: 'auto',
      sidebarCollapsed: false,
      panelVisibility: {
        layers: true,      // 默认显示图层面板
        tools: true,       // 始终显示工具面板
        properties: false, // 默认隐藏属性面板
        colors: false,     // 默认隐藏颜色面板
        effects: false,    // 默认隐藏效果面板
        ai: true,          // 默认显示AI助手面板
      },
      modalOpen: null,
      
      // 初始颜色状态
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        swatches: [
          '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
          '#ffff00', '#ff00ff', '#00ffff', '#808080', '#800000',
          '#008000', '#000080', '#808000', '#800080', '#008080',
        ],
        recentColors: [],
      },
      
      // 窗口大小
      windowSize: { width: 1200, height: 800 },
      
      // 键盘状态
      keyPressed: new Set(),

      // UI 状态操作
      setTheme: (theme) => {
        set({ theme })
        
        // 应用主题到 DOM
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // auto - 跟随系统
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.toggle('dark', isDark)
        }
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      // 面板显示控制 - 修复为单选模式
      togglePanel: (panel) => {
        set((state) => {
          // 如果点击的是当前激活的面板，则关闭它
          if (state.panelVisibility[panel]) {
            return {
              panelVisibility: {
                ...state.panelVisibility,
                [panel]: false,
              },
            }
          } else {
            // 否则关闭所有面板，只打开点击的面板
            return {
              panelVisibility: {
                layers: panel === 'layers',
                tools: state.panelVisibility.tools, // 工具面板保持不变
                properties: panel === 'properties',
                colors: panel === 'colors',
                effects: panel === 'effects',
                ai: panel === 'ai',
              },
            }
          }
        })
      },

      setPanelVisibility: (panel, visible) => {
        set((state) => ({
          panelVisibility: {
            ...state.panelVisibility,
            [panel]: visible,
          },
        }))
      },

      // 模态框控制
      openModal: (modalId) => {
        set({ modalOpen: modalId })
      },

      closeModal: () => {
        set({ modalOpen: null })
      },

      // 颜色管理
      setPrimaryColor: (color) => {
        set((state) => ({
          colors: { ...state.colors, primary: color },
        }))
        get().addToRecentColors(color)
      },

      setSecondaryColor: (color) => {
        set((state) => ({
          colors: { ...state.colors, secondary: color },
        }))
        get().addToRecentColors(color)
      },

      addToSwatches: (color) => {
        set((state) => {
          const swatches = state.colors.swatches.filter(c => c !== color)
          return {
            colors: {
              ...state.colors,
              swatches: [color, ...swatches].slice(0, 20), // 限制最多20个
            },
          }
        })
      },

      addToRecentColors: (color) => {
        set((state) => {
          const recentColors = state.colors.recentColors.filter(c => c !== color)
          return {
            colors: {
              ...state.colors,
              recentColors: [color, ...recentColors].slice(0, 10), // 限制最多10个
            },
          }
        })
      },

      removeFromSwatches: (color) => {
        set((state) => ({
          colors: {
            ...state.colors,
            swatches: state.colors.swatches.filter(c => c !== color),
          },
        }))
      },

      clearSwatches: () => {
        set((state) => ({
          colors: { ...state.colors, swatches: [] },
        }))
      },

      // 布局相关
      setWindowSize: (size) => {
        set({ windowSize: size })
      },

      // 键盘快捷键状态
      setKeyPressed: (key, pressed) => {
        set((state) => {
          const newKeyPressed = new Set(state.keyPressed)
          if (pressed) {
            newKeyPressed.add(key)
          } else {
            newKeyPressed.delete(key)
          }
          return { keyPressed: newKeyPressed }
        })
      },

      isKeyPressed: (key) => {
        return get().keyPressed.has(key)
      },
    }),
    {
      name: 'miniPaint-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        panelVisibility: state.panelVisibility,
        colors: state.colors,
      }),
    }
  )
)