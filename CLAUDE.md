# miniPaint React 重构项目规划

## 项目概述

使用现代技术栈 `pnpm + Vite + React + UnoCSS` 重构 miniPaint 在线图像编辑器，保持原有功能的同时提升性能、可维护性和用户体验。

## 技术栈选择

### 核心技术栈
- **包管理器**: pnpm (更快的安装速度，更少的磁盘占用)
- **构建工具**: Vite (极速热更新，原生 ESM 支持)
- **前端框架**: React 18 (并发特性，更好的性能)
- **样式方案**: UnoCSS (原子化 CSS，按需生成)
- **类型检查**: TypeScript (类型安全，更好的开发体验)

### 辅助技术
- **状态管理**: Zustand (轻量级，简单易用)
- **Canvas 库**: Fabric.js (功能强大的 Canvas 操作库)
- **UI 组件**: Radix UI (无样式组件库)
- **图标库**: Lucide React (现代化图标)
- **文件处理**: File API + Web Workers

## 项目结构设计

```
miniPaint-react/
├── public/                     # 静态资源
│   ├── icons/                 # 工具图标
│   └── examples/              # 示例文件
├── src/
│   ├── components/            # 通用组件
│   │   ├── ui/               # 基础 UI 组件
│   │   ├── canvas/           # Canvas 相关组件
│   │   ├── panels/           # 面板组件
│   │   └── tools/            # 工具组件
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useCanvas.ts      # Canvas 操作
│   │   ├── useTool.ts        # 工具状态
│   │   ├── useLayer.ts       # 图层管理
│   │   └── useHistory.ts     # 撤销重做
│   ├── stores/               # 状态管理
│   │   ├── canvas.ts         # Canvas 状态
│   │   ├── layers.ts         # 图层状态
│   │   ├── tools.ts          # 工具状态
│   │   └── ui.ts             # UI 状态
│   ├── utils/                # 工具函数
│   │   ├── canvas.ts         # Canvas 工具函数
│   │   ├── image.ts          # 图像处理
│   │   ├── file.ts           # 文件操作
│   │   └── effects.ts        # 效果处理
│   ├── workers/              # Web Workers
│   │   ├── image-processor.ts # 图像处理
│   │   └── effects.ts        # 效果计算
│   ├── types/                # TypeScript 类型定义
│   ├── constants/            # 常量定义
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── vite-env.d.ts        # Vite 类型声明
├── package.json
├── vite.config.ts
├── tsconfig.json
├── uno.config.ts
└── README.md
```

## 核心组件设计

### 1. 主应用布局 (App.tsx)
```tsx
interface AppLayout {
  header: MenuBar;           // 顶部菜单栏
  leftSidebar: ToolPanel;    // 左侧工具面板
  mainArea: CanvasArea;      // 主画布区域
  rightSidebar: {
    layerPanel: LayerPanel;  // 图层面板
    propertyPanel: PropertyPanel; // 属性面板
    colorPanel: ColorPanel;  // 颜色面板
  };
}
```

### 2. Canvas 组件架构
```tsx
// 主 Canvas 容器
<CanvasContainer>
  <CanvasBackground />      // 背景网格
  <MainCanvas />           // 主画布
  <OverlayCanvas />        // 覆盖层（选择框等）
  <PreviewCanvas />        // 预览层
</CanvasContainer>
```

### 3. 工具系统组件
```tsx
// 工具面板
<ToolPanel>
  <ToolGroup name="selection">
    <SelectTool />
    <MagicWandTool />
  </ToolGroup>
  <ToolGroup name="drawing">
    <BrushTool />
    <PencilTool />
    <EraserTool />
  </ToolGroup>
  <ToolGroup name="shapes">
    <RectangleTool />
    <EllipseTool />
    <LineTool />
  </ToolGroup>
</ToolPanel>
```

## 状态管理设计

### 1. Canvas Store (Zustand)
```typescript
interface CanvasStore {
  // 画布状态
  width: number;
  height: number;
  zoom: number;
  offset: { x: number; y: number };
  
  // 画布操作
  setDimensions: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  
  // 画布实例
  fabricCanvas: fabric.Canvas | null;
  setFabricCanvas: (canvas: fabric.Canvas) => void;
}
```

### 2. Layer Store
```typescript
interface LayerStore {
  layers: Layer[];
  activeLayerId: string | null;
  
  // 图层操作
  addLayer: (layer: Omit<Layer, 'id'>) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setActiveLayer: (id: string) => void;
}
```

### 3. Tool Store
```typescript
interface ToolStore {
  activeTool: ToolType;
  toolSettings: Record<ToolType, any>;
  
  setActiveTool: (tool: ToolType) => void;
  updateToolSettings: (tool: ToolType, settings: any) => void;
}
```

## 核心 Hooks 设计

### 1. useCanvas Hook
```typescript
const useCanvas = () => {
  const canvasStore = useCanvasStore();
  
  const initCanvas = useCallback((element: HTMLCanvasElement) => {
    const fabricCanvas = new fabric.Canvas(element);
    canvasStore.setFabricCanvas(fabricCanvas);
  }, []);
  
  const addObject = useCallback((object: fabric.Object) => {
    canvasStore.fabricCanvas?.add(object);
  }, [canvasStore.fabricCanvas]);
  
  return { initCanvas, addObject, canvas: canvasStore.fabricCanvas };
};
```

### 2. useHistory Hook (撤销重做)
```typescript
const useHistory = () => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const saveState = useCallback(() => {
    // 保存当前状态到历史记录
  }, []);
  
  const undo = useCallback(() => {
    // 撤销操作
  }, []);
  
  const redo = useCallback(() => {
    // 重做操作
  }, []);
  
  return { saveState, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
};
```

### 3. useTool Hook
```typescript
const useTool = (toolType: ToolType) => {
  const toolStore = useToolStore();
  const canvasStore = useCanvasStore();
  
  const isActive = toolStore.activeTool === toolType;
  const settings = toolStore.toolSettings[toolType];
  
  const activate = useCallback(() => {
    toolStore.setActiveTool(toolType);
  }, [toolType]);
  
  const updateSettings = useCallback((newSettings: any) => {
    toolStore.updateToolSettings(toolType, newSettings);
  }, [toolType]);
  
  return { isActive, settings, activate, updateSettings };
};
```

## 工具系统实现

### 1. 基础工具接口
```typescript
interface BaseTool {
  name: string;
  icon: string;
  cursor: string;
  
  onActivate?: () => void;
  onDeactivate?: () => void;
  onMouseDown?: (event: fabric.IEvent) => void;
  onMouseMove?: (event: fabric.IEvent) => void;
  onMouseUp?: (event: fabric.IEvent) => void;
}
```

### 2. 画笔工具实现
```typescript
class BrushTool implements BaseTool {
  name = 'brush';
  icon = 'brush';
  cursor = 'crosshair';
  
  onActivate() {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
  }
  
  onDeactivate() {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      canvas.isDrawingMode = false;
    }
  }
}
```

## 效果系统设计

### 1. Web Worker 图像处理
```typescript
// workers/image-processor.ts
self.onmessage = function(e) {
  const { imageData, effect, params } = e.data;
  
  let processedData;
  switch (effect) {
    case 'blur':
      processedData = applyBlur(imageData, params.radius);
      break;
    case 'brightness':
      processedData = applyBrightness(imageData, params.value);
      break;
    // ... 其他效果
  }
  
  self.postMessage({ processedData });
};
```

### 2. 效果应用 Hook
```typescript
const useEffects = () => {
  const applyEffect = useCallback(async (effect: EffectType, params: any) => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    const activeObject = canvas?.getActiveObject();
    
    if (activeObject && activeObject.type === 'image') {
      const worker = new Worker('/workers/image-processor.js');
      
      return new Promise((resolve) => {
        worker.postMessage({
          imageData: activeObject.toCanvasElement().getContext('2d').getImageData(),
          effect,
          params
        });
        
        worker.onmessage = (e) => {
          const { processedData } = e.data;
          // 应用处理后的图像数据
          resolve(processedData);
          worker.terminate();
        };
      });
    }
  }, []);
  
  return { applyEffect };
};
```

## 文件系统设计

### 1. 文件操作 Hook
```typescript
const useFileOperations = () => {
  const openFile = useCallback(async (file: File) => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      const img = await fabric.Image.fromURL(imageUrl);
      canvas?.add(img);
    } else if (file.name.endsWith('.json')) {
      // 加载 miniPaint 项目文件
      const projectData = JSON.parse(await file.text());
      await loadProject(projectData);
    }
  }, []);
  
  const saveProject = useCallback(() => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    const layers = useLayerStore.getState().layers;
    
    const projectData = {
      canvas: canvas?.toJSON(),
      layers,
      metadata: {
        version: '2.0',
        created: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
  }, []);
  
  const exportImage = useCallback((format: 'png' | 'jpg' | 'webp') => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    const dataURL = canvas?.toDataURL(`image/${format}`);
    
    if (dataURL) {
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `image.${format}`;
      a.click();
    }
  }, []);
  
  return { openFile, saveProject, exportImage };
};
```

## UnoCSS 配置

### 1. uno.config.ts
```typescript
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
      primary: {
        50: '#f0f9ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      }
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors',
    'btn-secondary': 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors',
    'panel': 'bg-white border border-gray-200 rounded-lg shadow-sm',
    'tool-button': 'w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors',
    'tool-button-active': 'w-10 h-10 flex items-center justify-center rounded bg-primary-100 text-primary-600',
  }
});
```

## 开发阶段规划

### 阶段 1: 项目初始化 (1周)
- [ ] 创建 Vite + React + TypeScript 项目
- [ ] 配置 pnpm workspace
- [ ] 设置 UnoCSS 和基础样式
- [ ] 配置 ESLint、Prettier
- [ ] 创建基础项目结构

### 阶段 2: 核心架构 (2-3周)
- [ ] 实现 Zustand 状态管理
- [ ] 创建基础 Canvas 组件
- [ ] 实现核心 Hooks (useCanvas, useHistory)
- [ ] 搭建主应用布局
- [ ] 集成 Fabric.js

### 阶段 3: 工具系统 (3-4周)
- [ ] 实现基础工具接口
- [ ] 开发选择工具
- [ ] 开发绘图工具 (画笔、铅笔、橡皮擦)
- [ ] 开发形状工具 (矩形、椭圆、线条)
- [ ] 实现工具属性面板

### 阶段 4: 图层系统 (2-3周)
- [ ] 实现图层数据结构
- [ ] 开发图层面板 UI
- [ ] 实现图层操作 (添加、删除、重排序)
- [ ] 支持图层可见性和透明度
- [ ] 实现图层混合模式

### 阶段 5: 效果系统 (3-4周)
- [ ] 设置 Web Workers
- [ ] 实现基础滤镜 (模糊、锐化、亮度、对比度)
- [ ] 开发高级效果 (Instagram 滤镜)
- [ ] 实现效果预览
- [ ] 优化效果处理性能

### 阶段 6: 文件系统 (2周)
- [ ] 实现文件打开功能
- [ ] 支持多种图像格式
- [ ] 实现项目保存/加载
- [ ] 支持图像导出
- [ ] 实现拖拽上传

### 阶段 7: UI/UX 优化 (2-3周)
- [ ] 响应式设计
- [ ] 键盘快捷键
- [ ] 主题切换
- [ ] 动画和过渡效果
- [ ] 移动端适配

### 阶段 8: 性能优化和测试 (2周)
- [ ] 性能分析和优化
- [ ] 内存泄漏检查
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户测试

## 技术难点和解决方案

### 1. Canvas 性能优化
- **问题**: 大图像处理时的性能瓶颈
- **解决方案**: 
  - 使用 OffscreenCanvas 进行后台渲染
  - 实现图像分块处理
  - 使用 Web Workers 处理复杂计算

### 2. 内存管理
- **问题**: 历史记录和大图像占用大量内存
- **解决方案**:
  - 实现智能历史记录清理
  - 使用 IndexedDB 存储大数据
  - 实现图像压缩和缓存策略

### 3. 跨浏览器兼容性
- **问题**: 不同浏览器的 Canvas API 差异
- **解决方案**:
  - 使用 Fabric.js 抽象 Canvas 操作
  - 实现 polyfill 支持
  - 渐进式功能增强

### 4. 移动端适配
- **问题**: 触摸操作和小屏幕适配
- **解决方案**:
  - 实现触摸手势识别
  - 响应式 UI 设计
  - 移动端专用工具栏

## 部署和发布

### 1. 构建配置
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          fabric: ['fabric'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
```

### 2. PWA 支持
- 实现 Service Worker
- 支持离线使用
- 添加到主屏幕功能

### 3. CDN 部署
- 静态资源 CDN 加速
- 图像处理 API 服务
- 全球节点部署

## 预期成果

### 性能提升
- 启动速度提升 60%
- 内存使用减少 40%
- 渲染性能提升 50%

### 开发体验
- TypeScript 类型安全
- 热更新开发体验
- 组件化架构便于维护

### 用户体验
- 现代化 UI 设计
- 响应式布局
- 更好的移动端支持

## 总结

这个重构方案采用现代前端技术栈，保持了原有 miniPaint 的核心功能，同时大幅提升了性能、可维护性和用户体验。通过分阶段的开发计划，可以确保项目稳步推进，最终交付一个高质量的现代化图像编辑器。