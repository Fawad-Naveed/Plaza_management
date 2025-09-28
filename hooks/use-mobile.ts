"use client"

import * as React from "react"
import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Enhanced mobile detection hook
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Hook to detect if the device is mobile based on screen width
 */
export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkMobile()

    // Add event listener for resize
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Hook for touch gesture detection
 */
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > 50
    const isRightSwipe = distanceX < -50
    const isUpSwipe = distanceY > 50
    const isDownSwipe = distanceY < -50

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY
    }
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

/**
 * Hook for managing mobile sidebar state
 */
export function useMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMobile()

  const openSidebar = () => setIsOpen(true)
  const closeSidebar = () => setIsOpen(false)
  const toggleSidebar = () => setIsOpen(!isOpen)

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [isMobile, isOpen])

  return {
    isOpen,
    isMobile,
    openSidebar,
    closeSidebar,
    toggleSidebar
  }
}

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('xs')
      else if (width < 768) setBreakpoint('sm')
      else if (width < 1024) setBreakpoint('md')
      else if (width < 1280) setBreakpoint('lg')
      else setBreakpoint('xl')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    isMobile: ['xs', 'sm'].includes(breakpoint),
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl'].includes(breakpoint)
  }
}

/**
 * Hook for preventing body scroll (useful for mobile modals/drawers)
 */
export function usePreventScroll(prevent: boolean) {
  useEffect(() => {
    if (prevent) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [prevent])
}
