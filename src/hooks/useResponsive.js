import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design
 * Provides breakpoint information and device detection
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('mobile')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [screenWidth, setScreenWidth] = useState(0)
  const [screenHeight, setScreenHeight] = useState(0)

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenWidth(width)
      setScreenHeight(height)
      
      if (width < 640) {
        setBreakpoint('mobile')
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      } else if (width < 1024) {
        setBreakpoint('tablet')
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else {
        setBreakpoint('desktop')
        setIsMobile(false)
        setIsTablet(false)
        setIsDesktop(true)
      }
    }

    // Initial check
    updateBreakpoint()

    // Add resize listener
    window.addEventListener('resize', updateBreakpoint)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    // Convenience methods
    isSmallMobile: screenWidth < 480,
    isLargeMobile: screenWidth >= 480 && screenWidth < 640,
    isSmallTablet: screenWidth >= 640 && screenWidth < 768,
    isLargeTablet: screenWidth >= 768 && screenWidth < 1024,
    isSmallDesktop: screenWidth >= 1024 && screenWidth < 1280,
    isLargeDesktop: screenWidth >= 1280
  }
}

/**
 * Hook for touch device detection
 */
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouch()
  }, [])

  return isTouchDevice
}

/**
 * Hook for device orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      )
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  return orientation
}

/**
 * Hook for reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for high contrast preference
 */
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (e) => setPrefersHighContrast(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}
