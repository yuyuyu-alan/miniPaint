import { useState, useEffect } from 'react'

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface Breakpoints {
  xs: number    // 0px
  sm: number    // 640px
  md: number    // 768px
  lg: number    // 1024px
  xl: number    // 1280px
  '2xl': number // 1536px
}

const breakpoints: Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('lg')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })

      // 确定当前断点
      let breakpoint: BreakpointKey = 'xs'
      for (const [key, value] of Object.entries(breakpoints)) {
        if (width >= value) {
          breakpoint = key as BreakpointKey
        }
      }
      setCurrentBreakpoint(breakpoint)
    }

    // 初始化
    handleResize()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 检查是否匹配指定断点
  const isBreakpoint = (breakpoint: BreakpointKey): boolean => {
    return windowSize.width >= breakpoints[breakpoint]
  }

  // 检查是否在指定断点范围内
  const isBetween = (min: BreakpointKey, max: BreakpointKey): boolean => {
    return windowSize.width >= breakpoints[min] && windowSize.width < breakpoints[max]
  }

  // 检查是否为移动设备
  const isMobile = windowSize.width < breakpoints.md

  // 检查是否为平板设备
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg

  // 检查是否为桌面设备
  const isDesktop = windowSize.width >= breakpoints.lg

  // 获取适合当前屏幕的面板宽度
  const getPanelWidth = (): number => {
    if (isMobile) return Math.min(280, windowSize.width * 0.8)
    if (isTablet) return 240
    return 256
  }

  // 获取适合当前屏幕的工具面板宽度
  const getToolPanelWidth = (): number => {
    if (isMobile) return 48
    return 64
  }

  // 检查面板是否应该默认显示
  const shouldShowPanel = (panelType: 'tools' | 'layers' | 'properties' | 'colors' | 'effects'): boolean => {
    if (isMobile) {
      // 移动端默认只显示工具面板
      return panelType === 'tools'
    }
    if (isTablet) {
      // 平板端显示工具和图层面板
      return panelType === 'tools' || panelType === 'layers'
    }
    // 桌面端显示所有面板
    return true
  }

  // 获取Canvas容器的样式
  const getCanvasContainerStyle = () => {
    if (isMobile) {
      return {
        flexDirection: 'column' as const,
        height: '100vh'
      }
    }
    return {
      flexDirection: 'row' as const,
      height: '100vh'
    }
  }

  // 获取适合当前设备的工具布局
  const getToolLayout = (): 'vertical' | 'horizontal' => {
    return isMobile ? 'horizontal' : 'vertical'
  }

  return {
    // 窗口信息
    windowSize,
    currentBreakpoint,
    
    // 设备类型检查
    isMobile,
    isTablet,
    isDesktop,
    
    // 断点检查
    isBreakpoint,
    isBetween,
    
    // 布局辅助
    getPanelWidth,
    getToolPanelWidth,
    shouldShowPanel,
    getCanvasContainerStyle,
    getToolLayout,
    
    // 响应式类名生成
    responsive: {
      hide: {
        mobile: 'hidden md:block',
        tablet: 'hidden lg:block',
        desktop: 'lg:hidden'
      },
      show: {
        mobile: 'block md:hidden',
        tablet: 'hidden md:block lg:hidden',
        desktop: 'hidden lg:block'
      },
      width: {
        mobile: 'w-full',
        tablet: 'w-60',
        desktop: 'w-64'
      }
    }
  }
}