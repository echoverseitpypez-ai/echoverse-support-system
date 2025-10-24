import React from 'react'
import { useResponsive, useTouchDevice, useOrientation, useReducedMotion, useHighContrast } from '../hooks/useResponsive.js'

/**
 * Responsive Test Component
 * Shows current responsive state for debugging
 */
const ResponsiveTest = ({ show = false }) => {
  const responsive = useResponsive()
  const isTouchDevice = useTouchDevice()
  const orientation = useOrientation()
  const prefersReducedMotion = useReducedMotion()
  const prefersHighContrast = useHighContrast()

  if (!show) return null

  return (
    <div className="responsive-test">
      <div className="card">
        <h3>Responsive Debug Info</h3>
        <div className="debug-grid">
          <div className="debug-item">
            <strong>Breakpoint:</strong> {responsive.breakpoint}
          </div>
          <div className="debug-item">
            <strong>Screen Size:</strong> {responsive.screenWidth} × {responsive.screenHeight}
          </div>
          <div className="debug-item">
            <strong>Device Type:</strong> 
            {responsive.isMobile && ' Mobile'}
            {responsive.isTablet && ' Tablet'}
            {responsive.isDesktop && ' Desktop'}
          </div>
          <div className="debug-item">
            <strong>Touch Device:</strong> {isTouchDevice ? 'Yes' : 'No'}
          </div>
          <div className="debug-item">
            <strong>Orientation:</strong> {orientation}
          </div>
          <div className="debug-item">
            <strong>Reduced Motion:</strong> {prefersReducedMotion ? 'Yes' : 'No'}
          </div>
          <div className="debug-item">
            <strong>High Contrast:</strong> {prefersHighContrast ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveTest
