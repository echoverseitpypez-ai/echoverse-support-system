import { useEffect, useRef } from 'react'

export const usePerformance = (componentName) => {
  const startTime = useRef(performance.now())
  
  useEffect(() => {
    const endTime = performance.now()
    const loadTime = endTime - startTime.current
    
    if (loadTime > 1000) { // Only log if loading takes more than 1 second
      console.warn(`🐌 ${componentName} took ${loadTime.toFixed(2)}ms to load`)
    } else {
      console.log(`⚡ ${componentName} loaded in ${loadTime.toFixed(2)}ms`)
    }
  }, [componentName])
  
  const measureFunction = (fn, name) => {
    return (...args) => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      
      if (end - start > 100) { // Log if function takes more than 100ms
        console.warn(`🐌 ${name} took ${(end - start).toFixed(2)}ms`)
      }
      
      return result
    }
  }
  
  return { measureFunction }
}