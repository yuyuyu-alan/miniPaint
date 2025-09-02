import React, { useState, useEffect, useRef, useCallback } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  onClick?: () => void
  submenu?: ContextMenuItem[]
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  onClose?: () => void
}

interface ContextMenuState {
  isVisible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return
    
    item.onClick?.()
    onClose?.()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48"
      style={{ maxHeight: '300px', overflowY: 'auto' }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="border-t border-gray-200 my-1" />
        }

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-3 py-2 text-left text-sm flex items-center justify-between
              transition-colors
              ${item.disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              {item.icon && (
                <span className="text-base">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <kbd className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                {item.shortcut}
              </kbd>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Context Menu Hook
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const showContextMenu = useCallback((
    event: React.MouseEvent | MouseEvent,
    items: ContextMenuItem[]
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const x = event.clientX
    const y = event.clientY

    // 确保菜单不会超出视口
    const menuWidth = 200 // 估算菜单宽度
    const menuHeight = items.length * 32 // 估算菜单高度
    
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y

    setContextMenu({
      isVisible: true,
      x: adjustedX,
      y: adjustedY,
      items
    })
  }, [])

  const hideContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const ContextMenuComponent = contextMenu ? (
    <div
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 1000
      }}
    >
      <ContextMenu
        items={contextMenu.items}
        onClose={hideContextMenu}
      />
    </div>
  ) : null

  return {
    showContextMenu,
    hideContextMenu,
    ContextMenuComponent,
    isVisible: contextMenu?.isVisible || false
  }
}

export default ContextMenu