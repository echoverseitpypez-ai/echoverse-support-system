import React from 'react'

/**
 * Responsive Card Component
 * Automatically adapts to mobile and desktop layouts
 */
const ResponsiveCard = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'card'
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-1',
    md: 'p-2',
    default: 'p-3',
    lg: 'p-4',
    xl: 'p-5'
  }
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }
  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-105' : ''

  const classes = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    hoverClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={classes}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      {children}
    </div>
  )
}

export default ResponsiveCard
