import React from 'react'

export interface InputProps {
  label?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  type?: 'text' | 'number' | 'email' | 'password' | 'search'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  error?: string
  className?: string
  autoFocus?: boolean
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  defaultValue,
  placeholder,
  type = 'text',
  size = 'md',
  disabled = false,
  error,
  className = '',
  autoFocus = false,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }
  
  const statusClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
    
  const disabledClasses = disabled
    ? 'bg-gray-50 cursor-not-allowed'
    : 'bg-white'
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${statusClasses} ${disabledClasses} ${className}`
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={classes}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input