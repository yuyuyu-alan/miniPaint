import React, { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import type { ToolType } from '@/types'

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    key: string
    description: string
    action?: string
  }>
}

const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  // 监听快捷键打开帮助
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 或 Ctrl+? 打开快捷键帮助
      if (e.key === 'F1' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault()
        setIsOpen(true)
      }
      // Escape 关闭帮助
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: '工具快捷键',
      shortcuts: [
        { key: 'V', description: '选择工具', action: 'select' },
        { key: 'B', description: '画笔工具', action: 'brush' },
        { key: 'R', description: '矩形工具', action: 'rectangle' },
        { key: 'C', description: '圆形工具', action: 'circle' },
        { key: 'T', description: '文本工具', action: 'text' },
        { key: 'L', description: '直线工具', action: 'line' },
        { key: 'K', description: '裁剪工具', action: 'crop' },
        { key: 'G', description: '填充工具', action: 'fill' },
        { key: 'E', description: '橡皮擦工具', action: 'erase' },
        { key: 'S', description: '仿制工具', action: 'clone' },
        { key: 'I', description: '吸色器工具', action: 'pick_color' },
      ]
    },
    {
      title: '编辑操作',
      shortcuts: [
        { key: 'Ctrl + Z', description: '撤销' },
        { key: 'Ctrl + Y', description: '重做' },
        { key: 'Ctrl + C', description: '复制选中对象' },
        { key: 'Ctrl + V', description: '粘贴对象' },
        { key: 'Ctrl + X', description: '剪切选中对象' },
        { key: 'Delete', description: '删除选中对象' },
        { key: 'Ctrl + A', description: '全选' },
        { key: 'Ctrl + D', description: '取消选择' },
      ]
    },
    {
      title: '视图控制',
      shortcuts: [
        { key: 'Ctrl + +', description: '放大' },
        { key: 'Ctrl + -', description: '缩小' },
        { key: 'Ctrl + 0', description: '实际大小' },
        { key: 'Ctrl + 9', description: '适合窗口' },
        { key: 'Space + 拖拽', description: '平移画布' },
        { key: 'Ctrl + 滚轮', description: '缩放画布' },
      ]
    },
    {
      title: '文件操作',
      shortcuts: [
        { key: 'Ctrl + N', description: '新建画布' },
        { key: 'Ctrl + O', description: '打开文件' },
        { key: 'Ctrl + S', description: '保存项目' },
        { key: 'Ctrl + Shift + S', description: '另存为' },
        { key: 'Ctrl + E', description: '导出图片' },
      ]
    },
    {
      title: '其他',
      shortcuts: [
        { key: 'F1', description: '显示快捷键帮助' },
        { key: 'Ctrl + /', description: '显示快捷键帮助' },
        { key: 'Escape', description: '取消当前操作' },
        { key: 'Tab', description: '切换面板显示' },
        { key: 'F11', description: '全屏模式' },
      ]
    }
  ]

  return (
    <>
      {/* 快捷键帮助按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40"
        title="快捷键帮助 (F1)"
      >
        ❓
      </Button>

      {/* 快捷键帮助模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="键盘快捷键"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 提示</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 大部分快捷键在输入框中不会生效</li>
              <li>• 按住 Shift 可以约束形状比例</li>
              <li>• 按住 Alt 可以从中心绘制形状</li>
              <li>• 双击工具按钮可以打开工具设置</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setIsOpen(false)}>
            关闭
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default KeyboardShortcuts