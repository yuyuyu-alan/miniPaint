import React, { useState } from 'react'
import { useImageEffects } from '@/hooks/useImageEffects'
import { Button, Input } from '@/components/ui'

interface EffectControlProps {
  title: string
  children: React.ReactNode
}

const EffectControl: React.FC<EffectControlProps> = ({ title, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-3">
      <h4 className="text-sm font-medium text-gray-800 mb-2">{title}</h4>
      {children}
    </div>
  )
}

const EffectPanel: React.FC = () => {
  const {
    brightness,
    contrast, 
    blur,
    grayscale,
    invert,
    applyEffect
  } = useImageEffects()

  // 效果参数状态
  const [brightnessValue, setBrightnessValue] = useState(0)
  const [contrastValue, setContrastValue] = useState(0)
  const [blurRadius, setBlurRadius] = useState(1)
  const [saturationValue, setSaturationValue] = useState(0)
  const [hueValue, setHueValue] = useState(0)

  // 处理滑块变化
  const handleSliderChange = (setter: (value: number) => void) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setter(Number(e.target.value))
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* 面板标题 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">效果</h3>
        <div className="text-xs text-gray-500">Phase 5</div>
      </div>

      {/* 效果控制区域 */}
      <div className="flex-1 p-4 overflow-y-auto">
        
        {/* 基础调节 */}
        <EffectControl title="基础调节">
          <div className="space-y-3">
            {/* 亮度 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">亮度</label>
                <span className="text-xs text-gray-500">{brightnessValue}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightnessValue}
                onChange={handleSliderChange(setBrightnessValue)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => brightness(brightnessValue)}
              >
                应用亮度
              </Button>
            </div>

            {/* 对比度 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">对比度</label>
                <span className="text-xs text-gray-500">{contrastValue}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrastValue}
                onChange={handleSliderChange(setContrastValue)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => contrast(contrastValue)}
              >
                应用对比度
              </Button>
            </div>

            {/* 饱和度 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">饱和度</label>
                <span className="text-xs text-gray-500">{saturationValue}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={saturationValue}
                onChange={handleSliderChange(setSaturationValue)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => applyEffect('saturate', { value: saturationValue })}
              >
                应用饱和度
              </Button>
            </div>

            {/* 色相 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">色相</label>
                <span className="text-xs text-gray-500">{hueValue}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={hueValue}
                onChange={handleSliderChange(setHueValue)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => applyEffect('hue-rotate', { angle: hueValue })}
              >
                应用色相
              </Button>
            </div>
          </div>
        </EffectControl>

        {/* 模糊和锐化 */}
        <EffectControl title="模糊和锐化">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">模糊半径</label>
                <span className="text-xs text-gray-500">{blurRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={blurRadius}
                onChange={handleSliderChange(setBlurRadius)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => blur(blurRadius)}
              >
                应用模糊
              </Button>
            </div>
          </div>
        </EffectControl>

        {/* 快速效果 */}
        <EffectControl title="快速效果">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => grayscale()}
            >
              灰度化
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => invert()}
            >
              反相
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffect('sepia')}
            >
              怀旧
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffect('vintage')}
            >
              复古
            </Button>
          </div>
        </EffectControl>

        {/* 重置按钮 */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setBrightnessValue(0)
              setContrastValue(0)
              setBlurRadius(1)
              setSaturationValue(0)
              setHueValue(0)
            }}
          >
            重置所有参数
          </Button>
        </div>

        {/* 使用说明 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-700 mb-2">使用说明</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 选择一个对象</li>
            <li>• 调整效果参数</li>
            <li>• 点击应用按钮</li>
            <li>• 支持撤销/重做</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EffectPanel