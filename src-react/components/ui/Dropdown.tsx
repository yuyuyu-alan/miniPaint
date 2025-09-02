import React, { useState, useRef, useEffect } from 'react'

export interface DropdownOption {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  onChange?: (value: string) => void
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = '请选择...',
  disabled = false,
  className = '',
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(option => option.value === value)
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleOptionClick = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }
  
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }
  
  const baseClasses = 'relative w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`${baseClasses} ${disabledClasses}`}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedOption?.icon && (
              <span className="mr-2">{selectedOption.icon}</span>
            )}
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full flex items-center px-3 py-2 text-left text-sm transition-colors ${
                  option.disabled
                    ? 'cursor-not-allowed text-gray-400'
                    : 'hover:bg-gray-100 text-gray-900'
                } ${option.value === value ? 'bg-primary-50 text-primary-700' : ''}`}
                onClick={() => !option.disabled && handleOptionClick(option.value)}
                disabled={option.disabled}
              >
                {option.icon && (
                  <span className="mr-2">{option.icon}</span>
                )}
                {option.label}
                {option.value === value && (
                  <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dropdown