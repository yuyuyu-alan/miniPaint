# miniPaint React 重构 - 项目内存文档

> 本文档是 miniPaint React 重构项目的核心参考文档，包含项目架构、编码标准、工作流程等关键信息。

## 🏗️ 项目架构概览

### 技术栈
```
pnpm + Vite + React 19 + TypeScript + UnoCSS + Zustand + Fabric.js
```

### 核心依赖
- **状态管理**: Zustand (轻量级，简单易用)
- **Canvas 库**: Fabric.js (功能强大的 Canvas 操作库)  
- **UI 组件**: Radix UI (无样式组件库)
- **图标库**: Lucide React (现代化图标)
- **样式**: UnoCSS (原子化 CSS，按需生成)

## 📁 项目结构标准

```
src/
├── components/               # 组件目录
│   ├── ui/                  # 基础UI组件 (Button, Input, Modal等)
│   ├── canvas/              # Canvas相关组件
│   ├── panels/              # 面板组件 (ToolPanel, LayerPanel等)
│   └── tools/               # 工具组件 (BrushTool, SelectTool等)
├── hooks/                   # 自定义Hooks
│   ├── useCanvas.ts         # Canvas操作Hook
│   ├── useTool.ts           # 工具状态Hook
│   ├── useLayer.ts          # 图层管理Hook
│   └── useHistory.ts        # 撤销重做Hook
├── stores/                  # Zustand状态管理
│   ├── canvas.ts            # Canvas状态
│   ├── layers.ts            # 图层状态
│   ├── tools.ts             # 工具状态
│   └── ui.ts                # UI状态
├── utils/                   # 工具函数
├── workers/                 # Web Workers
├── types/                   # TypeScript类型定义
├── constants/               # 常量定义
└── App.tsx                  # 主应用组件
```

### 文件命名规范
- **组件**: PascalCase (ToolPanel.tsx)
- **Hooks**: camelCase with use prefix (useCanvas.ts)
- **工具函数**: camelCase (imageUtils.ts)
- **类型定义**: PascalCase with Type suffix (CanvasType.ts)
- **常量**: UPPER_SNAKE_CASE (TOOL_TYPES.ts)

## 🧩 核心组件架构

### 主应用布局
```tsx
// App.tsx - 主应用组件
<div className="app-layout">
  <MenuBar />                    // 顶部菜单栏
  <div className="main-content">
    <ToolPanel />                // 左侧工具面板
    <CanvasArea />               // 主画布区域
    <div className="right-panels">
      <LayerPanel />             // 图层面板
      <PropertyPanel />          // 属性面板
      <ColorPanel />             // 颜色面板
    </div>
  </div>
</div>
```

### Canvas 组件层次
```tsx
<CanvasContainer>
  <CanvasBackground />          // 背景网格/透明度显示
  <MainCanvas />               // 主画布 (Fabric.js)
  <OverlayCanvas />            // 覆盖层 (选择框、辅助线等)
  <PreviewCanvas />            // 预览层 (效果预览)
</CanvasContainer>
```

## 🗄️ 状态管理架构 (Zustand)

### Canvas Store
```typescript
interface CanvasStore {
  // 画布基础状态
  width: number;
  height: number;
  zoom: number;
  offset: { x: number; y: number };
  
  // Fabric.js 实例
  fabricCanvas: fabric.Canvas | null;
  
  // 操作方法
  setDimensions: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  setFabricCanvas: (canvas: fabric.Canvas) => void;
}
```

### Layer Store
```typescript
interface LayerStore {
  layers: Layer[];
  activeLayerId: string | null;
  
  // CRUD 操作
  addLayer: (layer: Omit<Layer, 'id'>) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setActiveLayer: (id: string) => void;
}
```

### Tool Store
```typescript
interface ToolStore {
  activeTool: ToolType;
  toolSettings: Record<ToolType, ToolSettings>;
  
  setActiveTool: (tool: ToolType) => void;
  updateToolSettings: (tool: ToolType, settings: Partial<ToolSettings>) => void;
}
```

## 🪝 核心 Hooks 设计

### useCanvas Hook
```typescript
const useCanvas = () => {
  const { fabricCanvas, setFabricCanvas } = useCanvasStore();
  
  const initCanvas = useCallback((element: HTMLCanvasElement) => {
    const canvas = new fabric.Canvas(element, {
      width: 800,
      height: 600,
      backgroundColor: 'white'
    });
    setFabricCanvas(canvas);
  }, [setFabricCanvas]);
  
  const addObject = useCallback((object: fabric.Object) => {
    fabricCanvas?.add(object);
    fabricCanvas?.renderAll();
  }, [fabricCanvas]);
  
  return { initCanvas, addObject, canvas: fabricCanvas };
};
```

### useHistory Hook
```typescript
const useHistory = () => {
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const saveState = useCallback(() => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      const state = canvas.toJSON();
      setHistory(prev => [...prev.slice(0, currentIndex + 1), state]);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);
  
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const canvas = useCanvasStore.getState().fabricCanvas;
      canvas?.loadFromJSON(history[currentIndex - 1], () => {
        canvas.renderAll();
      });
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, history]);
  
  return { saveState, undo, redo, canUndo: currentIndex > 0 };
};
```

### useTool Hook
```typescript
const useTool = (toolType: ToolType) => {
  const { activeTool, toolSettings, setActiveTool, updateToolSettings } = useToolStore();
  
  const isActive = activeTool === toolType;
  const settings = toolSettings[toolType] || {};
  
  const activate = useCallback(() => {
    setActiveTool(toolType);
  }, [toolType, setActiveTool]);
  
  return { isActive, settings, activate, updateToolSettings };
};
```

## 🛠️ 工具系统架构

### 工具基类接口
```typescript
interface BaseTool {
  name: ToolType;
  icon: string;
  cursor: string;
  settings: ToolSettings;
  
  onActivate?: (canvas: fabric.Canvas) => void;
  onDeactivate?: (canvas: fabric.Canvas) => void;
  onMouseDown?: (event: fabric.IEvent) => void;
  onMouseMove?: (event: fabric.IEvent) => void;
  onMouseUp?: (event: fabric.IEvent) => void;
}
```

### 工具实现示例
```typescript
// 画笔工具
export class BrushTool implements BaseTool {
  name = 'brush' as const;
  icon = 'brush';
  cursor = 'crosshair';
  settings = { size: 5, color: '#000000', opacity: 1 };
  
  onActivate(canvas: fabric.Canvas) {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = this.settings.size;
    canvas.freeDrawingBrush.color = this.settings.color;
  }
  
  onDeactivate(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
  }
}

// 选择工具
export class SelectTool implements BaseTool {
  name = 'select' as const;
  icon = 'mouse-pointer';
  cursor = 'default';
  settings = {};
  
  onActivate(canvas: fabric.Canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = true;
  }
}
```

## 🎨 效果系统架构

### Web Worker 图像处理
```typescript
// workers/image-processor.ts
interface ProcessMessage {
  imageData: ImageData;
  effect: EffectType;
  params: EffectParams;
}

self.onmessage = function(e: MessageEvent<ProcessMessage>) {
  const { imageData, effect, params } = e.data;
  
  let processedData: ImageData;
  
  switch (effect) {
    case 'blur':
      processedData = Effects.blur(imageData, params.radius);
      break;
    case 'brightness':
      processedData = Effects.brightness(imageData, params.value);
      break;
    case 'contrast':
      processedData = Effects.contrast(imageData, params.value);
      break;
    default:
      processedData = imageData;
  }
  
  self.postMessage({ processedData });
};
```

### 效果应用 Hook
```typescript
const useEffects = () => {
  const applyEffect = useCallback(async (effect: EffectType, params: EffectParams) => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    const activeObject = canvas?.getActiveObject();
    
    if (activeObject && activeObject.type === 'image') {
      const worker = new Worker('/workers/image-processor.js');
      
      const processedData = await new Promise<ImageData>((resolve) => {
        worker.postMessage({ imageData: getImageData(activeObject), effect, params });
        worker.onmessage = (e) => {
          resolve(e.data.processedData);
          worker.terminate();
        };
      });
      
      // 应用处理后的图像
      updateObjectWithImageData(activeObject, processedData);
      canvas?.renderAll();
    }
  }, []);
  
  return { applyEffect };
};
```

## 📁 文件系统架构

### 文件操作 Hook
```typescript
const useFileOperations = () => {
  const { fabricCanvas } = useCanvasStore();
  const { layers } = useLayerStore();
  
  const openFile = useCallback(async (file: File) => {
    if (!fabricCanvas) return;
    
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      const img = await fabric.Image.fromURL(imageUrl);
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
    } else if (file.name.endsWith('.json')) {
      const projectData = JSON.parse(await file.text());
      await loadProject(projectData);
    }
  }, [fabricCanvas]);
  
  const saveProject = useCallback(() => {
    if (!fabricCanvas) return;
    
    const projectData = {
      canvas: fabricCanvas.toJSON(['id', 'selectable']),
      layers,
      metadata: {
        version: '2.0',
        created: new Date().toISOString(),
        width: fabricCanvas.width,
        height: fabricCanvas.height
      }
    };
    
    downloadFile(JSON.stringify(projectData, null, 2), 'project.json', 'application/json');
  }, [fabricCanvas, layers]);
  
  const exportImage = useCallback((format: 'png' | 'jpg' | 'webp', quality = 1) => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality,
      multiplier: 1
    });
    
    downloadFile(dataURL, `image.${format}`, `image/${format}`);
  }, [fabricCanvas]);
  
  return { openFile, saveProject, exportImage };
};
```

## 🎨 样式系统 (UnoCSS)

### 配置文件
```typescript
// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default),
      }
    })
  ],
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    }
  },
  shortcuts: {
    // 按钮样式
    'btn': 'px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition-colors',
    'btn-secondary': 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors',
    
    // 面板样式
    'panel': 'bg-white border border-gray-200 rounded-lg shadow-sm p-4',
    'panel-header': 'flex items-center justify-between mb-4 pb-2 border-b border-gray-200',
    
    // 工具按钮
    'tool-btn': 'w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors',
    'tool-btn-active': 'w-10 h-10 flex items-center justify-center rounded bg-primary/10 text-primary',
    
    // 布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
  }
});
```

### 常用样式类
```typescript
// 布局类
'flex flex-col h-screen'           // 全屏垂直布局
'grid grid-cols-[auto_1fr_auto]'   // 三栏网格布局
'absolute inset-0'                 // 绝对定位填满父容器

// 交互类
'cursor-pointer select-none'       // 可点击不可选择
'transition-all duration-200'      // 平滑过渡动画
'hover:bg-gray-100 active:bg-gray-200' // 悬停和激活状态

// 工具面板类
'border-r border-gray-200 bg-gray-50' // 右边框和背景
'p-2 space-y-1'                   // 内边距和垂直间距
```

## 📝 编码标准

### TypeScript 规范
```typescript
// 接口定义
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

// React 19 组件定义 (使用 React Compiler 优化)
const Component: React.FC<ComponentProps> = ({ className, children, onClick }) => {
  return (
    <div className={cn('base-class', className)} onClick={onClick}>
      {children}
    </div>
  );
};

// React 19 use() Hook 示例
const useAsyncData = (promise: Promise<any>) => {
  const data = use(promise);
  return data;
};

// 传统 Hook 定义
const useCustomHook = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);
  
  return { value, updateValue };
};
```

### 组件规范
```typescript
// React 19 组件文件结构
import React, { use } from 'react';
import { cn } from '@/utils/cn';
import type { ComponentProps } from './types';

// React 19 组件实现 (自动优化)
export const Component: React.FC<ComponentProps> = (props) => {
  // React 19 自动优化，无需手动 memo
  // React Compiler 会自动处理重渲染优化
  
  return (
    <div className={cn('component-base', props.className)}>
      {props.children}
    </div>
  );
};

// 异步组件示例 (React 19)
export const AsyncComponent: React.FC<{ dataPromise: Promise<any> }> = ({ dataPromise }) => {
  const data = use(dataPromise);
  
  return <div>{data.content}</div>;
};

// 默认导出
export default Component;
```

### 状态管理规范
```typescript
// Zustand Store 定义
interface StoreState {
  data: DataType[];
  loading: boolean;
  error: string | null;
}

interface StoreActions {
  fetchData: () => Promise<void>;
  updateData: (id: string, updates: Partial<DataType>) => void;
  clearError: () => void;
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // 初始状态
  data: [],
  loading: false,
  error: null,
  
  // 操作方法
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.fetchData();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateData: (id, updates) => {
    set(state => ({
      data: state.data.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },
  
  clearError: () => set({ error: null })
}));
```

## 🔄 常见工作流程

### 1. 添加新工具
```bash
# 1. 创建工具文件
touch src/tools/NewTool.ts

# 2. 实现工具类
# 3. 在工具注册表中注册
# 4. 添加工具图标和样式
# 5. 更新工具类型定义
```

### 2. 添加新效果
```bash
# 1. 在 workers/effects.ts 中添加效果函数
# 2. 更新效果类型定义
# 3. 在效果面板中添加UI控件
# 4. 测试效果性能
```

### 3. 添加新组件
```bash
# 1. 创建组件文件和类型定义
# 2. 实现组件逻辑
# 3. 添加样式类
# 4. 编写单元测试
# 5. 更新 Storybook 文档
```

### 4. 性能优化检查清单 (React 19)
- [ ] 启用 React Compiler 自动优化
- [ ] 使用 use() Hook 处理异步数据
- [ ] 利用 Concurrent Features 优化用户体验
- [ ] 检查不必要的重新渲染（React DevTools Profiler）
- [ ] 优化 Canvas 渲染频率
- [ ] 使用 Web Workers 处理重计算
- [ ] 实现虚拟滚动（如果需要）
- [ ] 使用 React 19 的自动批处理优化

## 🚀 部署和构建

### 构建命令
```bash
# 开发环境
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 环境变量
```bash
# .env.local
VITE_APP_TITLE=miniPaint
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

## 🐛 调试和测试

### 调试工具
- **React DevTools**: 组件状态调试
- **Zustand DevTools**: 状态管理调试
- **Canvas Inspector**: Canvas 元素检查
- **Performance Monitor**: 性能监控

### 测试策略
```typescript
// 组件测试
import { render, screen } from '@testing-library/react';
import { ToolPanel } from './ToolPanel';

test('renders tool panel with tools', () => {
  render(<ToolPanel />);
  expect(screen.getByRole('toolbar')).toBeInTheDocument();
});

// Hook 测试
import { renderHook, act } from '@testing-library/react';
import { useCanvas } from './useCanvas';

test('initializes canvas correctly', () => {
  const { result } = renderHook(() => useCanvas());
  
  act(() => {
    const mockElement = document.createElement('canvas');
    result.current.initCanvas(mockElement);
  });
  
  expect(result.current.canvas).toBeTruthy();
});
```

## 📚 参考资源

### 官方文档
- [React 19 文档](https://react.dev/)
- [Fabric.js 文档](http://fabricjs.com/docs/)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [UnoCSS 文档](https://unocss.dev/)
- [Vite 文档](https://vitejs.dev/)

### React 19 新特性
- [React Compiler](https://react.dev/learn/react-compiler) - 自动优化组件
- [Actions](https://react.dev/reference/rsc/use-server) - 服务器操作支持
- [use() Hook](https://react.dev/reference/react/use) - 异步数据处理
- [Concurrent Features](https://react.dev/blog/2022/03/29/react-v18) - 并发渲染优化

### 最佳实践
- [React 19 性能优化](https://react.dev/learn/render-and-commit)
- [Canvas 性能优化](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Web Workers 使用指南](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

---

> 本文档会随着项目发展持续更新，请确保使用最新版本。