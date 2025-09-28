"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useBreakpoint } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95 active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 active:bg-destructive/95 active:scale-[0.98] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/90 active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 text-sm has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 text-sm has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 text-base has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10", 
        "icon-xl": "size-12",
      },
      mobile: {
        true: "touch-manipulation", // Optimizes touch response
        false: ""
      },
      fullWidth: {
        true: "w-full",
        false: ""
      },
      loading: {
        true: "cursor-not-allowed",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      mobile: false,
      fullWidth: false,
      loading: false
    },
  }
)

interface MobileButtonProps extends React.ComponentProps<"button">, VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    mobile: mobilePropsOverride, 
    fullWidth, 
    loading, 
    loadingText,
    children,
    disabled,
    asChild = false, 
    ...props 
  }, ref) => {
    const { isMobile } = useBreakpoint()
    const Comp = asChild ? Slot : "button"
    
    // Automatically enable mobile optimizations on mobile devices unless explicitly overridden
    const mobileOptimized = mobilePropsOverride !== undefined ? mobilePropsOverride : isMobile
    
    // Adjust size for mobile if not explicitly set
    const responsiveSize = React.useMemo(() => {
      if (size) return size
      return isMobile ? "lg" : "default"
    }, [size, isMobile])

    // Loading state
    const isDisabled = disabled || loading

    const buttonContent = React.useMemo(() => {
      if (loading) {
        return (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText || (isMobile ? "Loading..." : children)}
          </>
        )
      }
      return children
    }, [loading, loadingText, children, isMobile])

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          mobileButtonVariants({ 
            variant, 
            size: responsiveSize, 
            mobile: mobileOptimized, 
            fullWidth, 
            loading,
            className 
          }),
          // Mobile-specific touch optimizations
          isMobile && [
            "min-h-[44px]", // iOS/Android recommended minimum touch target
            "active:opacity-70", // Visual feedback on touch
            "select-none", // Prevent text selection on long press
          ]
        )}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)

MobileButton.displayName = "MobileButton"

// Preset button components for common mobile patterns
const MobileButtonPrimary = React.forwardRef<HTMLButtonElement, Omit<MobileButtonProps, 'variant'>>(
  (props, ref) => <MobileButton ref={ref} variant="default" {...props} />
)
MobileButtonPrimary.displayName = "MobileButtonPrimary"

const MobileButtonSecondary = React.forwardRef<HTMLButtonElement, Omit<MobileButtonProps, 'variant'>>(
  (props, ref) => <MobileButton ref={ref} variant="outline" {...props} />
)
MobileButtonSecondary.displayName = "MobileButtonSecondary"

const MobileButtonDanger = React.forwardRef<HTMLButtonElement, Omit<MobileButtonProps, 'variant'>>(
  (props, ref) => <MobileButton ref={ref} variant="destructive" {...props} />
)
MobileButtonDanger.displayName = "MobileButtonDanger"

// Floating Action Button for mobile
interface FABProps extends Omit<MobileButtonProps, 'size' | 'variant'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  offset?: number
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, position = 'bottom-right', offset = 16, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': `bottom-${offset} right-${offset}`,
      'bottom-left': `bottom-${offset} left-${offset}`, 
      'bottom-center': `bottom-${offset} left-1/2 -translate-x-1/2`
    }

    return (
      <MobileButton
        ref={ref}
        variant="default"
        size="icon-xl"
        className={cn(
          "fixed z-50 shadow-lg hover:shadow-xl transition-shadow",
          "rounded-full w-14 h-14",
          positionClasses[position],
          className
        )}
        {...props}
      />
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export { 
  MobileButton, 
  MobileButtonPrimary, 
  MobileButtonSecondary, 
  MobileButtonDanger,
  FloatingActionButton,
  mobileButtonVariants 
}