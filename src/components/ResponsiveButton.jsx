import React from 'react'

/**
 * Responsive Button Component
 * Touch-optimized for mobile, enhanced for desktop
 */
const ResponsiveButton = ({ 
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'btn'
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning'
  }
  
  const sizeClasses = {
    sm: 'btn-sm',
    default: 'btn-default',
    lg: 'btn-lg',
    xl: 'btn-xl'
  }
  
  const stateClasses = [
    disabled ? 'btn-disabled' : '',
    loading ? 'btn-loading' : '',
    fullWidth ? 'btn-full-width' : ''
  ].filter(Boolean).join(' ')

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses,
    className
  ].filter(Boolean).join(' ')

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
          </svg>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="btn-icon-left">{icon}</span>
      )}
      
      {!loading && (
        <span className="btn-text">{children}</span>
      )}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="btn-icon-right">{icon}</span>
      )}
    </button>
  )
}

export default ResponsiveButton
