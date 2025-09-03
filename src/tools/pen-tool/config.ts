/**
 * 钢笔工具配置常量
 */
export const PEN_TOOL_CONFIG = {
  // 几何计算相关
  CLOSE_THRESHOLD_PX: 32,           // 闭合检测阈值（像素）
  CONTROL_POINT_RADIUS: 3,          // 控制点半径
  ANCHOR_POINT_RADIUS: 4,           // 锚点半径
  ANCHOR_POINT_RADIUS_CLOSABLE: 6,  // 可闭合锚点半径
  POINT_DETECTION_THRESHOLD: 8,     // 点击检测阈值
  
  // 时间控制相关
  FINALIZE_SUPPRESS_TIME: 400,      // 完成后抑制时间（毫秒）
  MOUSEDOWN_SUPPRESS_TIME: 800,     // 鼠标按下抑制时间（毫秒）
  CLOSING_FLAG_RESET_TIME: 100,     // 闭合标志重置时间（毫秒）
  
  // 渲染优化相关
  RENDER_DEBOUNCE_TIME: 16,         // 渲染防抖时间（60fps）
  MAX_CONTROL_POINTS_CACHE: 50,     // 控制点缓存最大数量
  
  // 贝塞尔曲线相关
  DEFAULT_SMOOTHING: 0.5,           // 默认平滑度
  CONTROL_POINT_DISTANCE_RATIO: 0.3, // 控制点距离比例
} as const

/**
 * 钢笔工具样式配置
 */
export const PEN_TOOL_STYLES = {
  // 锚点样式
  ANCHOR_POINT: {
    NORMAL: {
      fill: '#007bff',
      stroke: '#ffffff',
      strokeWidth: 2,
    },
    CLOSABLE: {
      fill: '#28a745',
      stroke: '#ffffff', 
      strokeWidth: 3,
    },
    SELECTED: {
      fill: '#dc3545',
      stroke: '#ffffff',
      strokeWidth: 2,
    },
  },
  
  // 控制点样式
  CONTROL_POINT: {
    POINT1: {
      fill: '#28a745',
      stroke: '#ffffff',
      strokeWidth: 1,
    },
    POINT2: {
      fill: '#dc3545', 
      stroke: '#ffffff',
      strokeWidth: 1,
    },
  },
  
  // 控制线样式
  CONTROL_LINE: {
    POINT1: {
      stroke: '#28a745',
      strokeWidth: 1,
    },
    POINT2: {
      stroke: '#dc3545',
      strokeWidth: 1,
    },
  },
  
  // 预览路径样式
  PREVIEW_PATH: {
    fill: 'transparent',
    stroke: '#007bff',
    strokeWidth: 2,
    selectable: false,
    evented: false,
  },
  
  // 最终路径样式
  FINAL_PATH: {
    selectable: false,
    evented: false,
  },
} as const

/**
 * 钢笔工具错误消息
 */
export const PEN_TOOL_MESSAGES = {
  ERRORS: {
    CANVAS_NOT_INITIALIZED: '画布未初始化',
    INVALID_POINT_DATA: '无效的点数据',
    PATH_GENERATION_FAILED: '路径生成失败',
    RENDER_ERROR: '渲染错误',
  },
  
  INFO: {
    TOOL_ACTIVATED: '钢笔工具已激活 - 点击创建锚点，拖拽调整贝塞尔曲线，双击完成路径',
    PATH_CLOSED: '路径已闭合',
    PATH_FINISHED: '路径已完成',
  },
} as const

/**
 * 钢笔工具默认设置
 */
export const PEN_TOOL_DEFAULTS = {
  strokeColor: '#000000',
  strokeWidth: 2,
  fillColor: 'transparent',
  smoothing: PEN_TOOL_CONFIG.DEFAULT_SMOOTHING,
  showControlPoints: true,
  snapToGrid: false,
} as const