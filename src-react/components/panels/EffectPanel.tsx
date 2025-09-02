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
    applyEffectToSelection,
    applyEffectToCanvas,
    previewEffect,
    isProcessing,
    supportedEffects
  } = useImageEffects()

  // 效果参数状态
  const [brightnessValue, setBrightnessValue] = useState(0)
  const [contrastValue, setContrastValue] = useState(0)
  const [blurRadius, setBlurRadius] = useState(1)
  const [saturationValue, setSaturationValue] = useState(0)
  const [hueValue, setHueValue] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={async () => {
                    const url = await previewEffect('brightness', { value: brightnessValue })
                    setPreviewUrl(url)
                  }}
                  disabled={isProcessing}
                >
                  预览
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => applyEffectToSelection('brightness', { value: brightnessValue })}
                  disabled={isProcessing}
                >
                  应用
                </Button>
              </div>
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
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={async () => {
                    const url = await previewEffect('contrast', { value: contrastValue })
                    setPreviewUrl(url)
                  }}
                  disabled={isProcessing}
                >
                  预览
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => applyEffectToSelection('contrast', { value: contrastValue })}
                  disabled={isProcessing}
                >
                  应用
                </Button>
              </div>
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
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={async () => {
                    const url = await previewEffect('saturate', { value: saturationValue })
                    setPreviewUrl(url)
                  }}
                  disabled={isProcessing}
                >
                  预览
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => applyEffectToSelection('saturate', { value: saturationValue })}
                  disabled={isProcessing}
                >
                  应用
                </Button>
              </div>
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
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={async () => {
                    const url = await previewEffect('hue-rotate', { angle: hueValue })
                    setPreviewUrl(url)
                  }}
                  disabled={isProcessing}
                >
                  预览
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => applyEffectToSelection('hue-rotate', { angle: hueValue })}
                  disabled={isProcessing}
                >
                  应用
                </Button>
              </div>
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
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={async () => {
                    const url = await previewEffect('blur', { radius: blurRadius })
                    setPreviewUrl(url)
                  }}
                  disabled={isProcessing}
                >
                  预览
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => applyEffectToSelection('blur', { radius: blurRadius })}
                  disabled={isProcessing}
                >
                  应用
                </Button>
              </div>
            </div>
          </div>
        </EffectControl>

        {/* 快速效果 */}
        <EffectControl title="快速效果">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('grayscale')}
              disabled={isProcessing}
            >
              灰度化
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('invert')}
              disabled={isProcessing}
            >
              反相
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('sepia')}
              disabled={isProcessing}
            >
              怀旧
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('vintage')}
              disabled={isProcessing}
            >
              复古
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('sharpen')}
              disabled={isProcessing}
            >
              锐化
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyEffectToSelection('emboss')}
              disabled={isProcessing}
            >
              浮雕
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

        {/* 预览区域 */}
        {previewUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-medium text-gray-700 mb-2">效果预览</h5>
            <img
              src={previewUrl}
              alt="Effect Preview"
              className="w-full h-24 object-contain bg-white rounded border"
            />
          </div>
        )}

        {/* 处理状态 */}
        {isProcessing && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">正在处理效果...</span>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-700 mb-2">使用说明</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 选择一个对象或图层</li>
            <li>• 调整效果参数</li>
            <li>• 点击预览查看效果</li>
            <li>• 点击应用确认效果</li>
            <li>• 支持撤销/重做</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EffectPanel