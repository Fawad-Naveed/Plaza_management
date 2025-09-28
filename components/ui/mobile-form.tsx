"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useBreakpoint } from "@/hooks/use-mobile"

interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  spacing?: "sm" | "md" | "lg"
}

interface MobileFormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title?: string
  description?: string
}

interface MobileFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  label?: string
  error?: string
  required?: boolean
  fullWidth?: boolean
}

interface MobileFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  sticky?: boolean
  align?: "left" | "center" | "right"
}

const MobileForm = React.forwardRef<HTMLFormElement, MobileFormProps>(
  ({ className, children, spacing = "md", ...props }, ref) => {
    const { isMobile } = useBreakpoint()

    const spacingClasses = {
      sm: isMobile ? "space-y-4" : "space-y-4",
      md: isMobile ? "space-y-6" : "space-y-6", 
      lg: isMobile ? "space-y-8" : "space-y-8"
    }

    return (
      <form
        ref={ref}
        className={cn(
          "w-full",
          spacingClasses[spacing],
          isMobile && "px-0",
          className
        )}
        {...props}
      >
        {children}
      </form>
    )
  }
)
MobileForm.displayName = "MobileForm"

const MobileFormSection = React.forwardRef<HTMLDivElement, MobileFormSectionProps>(
  ({ className, children, title, description, ...props }, ref) => {
    const { isMobile } = useBreakpoint()

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4",
          isMobile && "border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className={cn(
                "font-semibold text-gray-900",
                isMobile ? "text-lg" : "text-xl"
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                "text-gray-600",
                isMobile ? "text-sm" : "text-base"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
        <div className={cn(
          "space-y-4",
          isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"
        )}>
          {children}
        </div>
      </div>
    )
  }
)
MobileFormSection.displayName = "MobileFormSection"

const MobileFormField = React.forwardRef<HTMLDivElement, MobileFormFieldProps>(
  ({ className, children, label, error, required, fullWidth, ...props }, ref) => {
    const { isMobile } = useBreakpoint()

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-2",
          fullWidth && "col-span-full",
          className
        )}
        {...props}
      >
        {label && (
          <label className={cn(
            "block font-medium text-gray-700",
            isMobile ? "text-sm" : "text-sm",
            required && "after:content-['*'] after:text-red-500 after:ml-1"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                className: cn(
                  child.props.className,
                  isMobile && "touch-button text-base", // Larger text and touch targets on mobile
                  error && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )
              })
            }
            return child
          })}
        </div>
        {error && (
          <p className={cn(
            "text-red-600",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {error}
          </p>
        )}
      </div>
    )
  }
)
MobileFormField.displayName = "MobileFormField"

const MobileFormActions = React.forwardRef<HTMLDivElement, MobileFormActionsProps>(
  ({ className, children, sticky, align = "right", ...props }, ref) => {
    const { isMobile } = useBreakpoint()

    const alignClasses = {
      left: "justify-start",
      center: "justify-center", 
      right: "justify-end"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-3",
          alignClasses[align],
          isMobile ? [
            "flex-col-reverse",
            sticky && [
              "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200",
              "p-4 safe-area-pb z-30 shadow-lg"
            ]
          ] : [
            "flex-row",
            "pt-6"
          ],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: cn(
                child.props.className,
                isMobile && "touch-button w-full justify-center font-medium"
              )
            })
          }
          return child
        })}
      </div>
    )
  }
)
MobileFormActions.displayName = "MobileFormActions"

// Mobile-optimized input wrapper
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const { isMobile } = useBreakpoint()

    return (
      <div className="space-y-2">
        {label && (
          <label className={cn(
            "block font-medium text-gray-700",
            isMobile ? "text-sm" : "text-sm"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "block w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-indigo-500 focus:ring-indigo-500",
              isMobile && [
                "text-base", // Prevents zoom on iOS
                "min-h-[44px]", // Touch target
                "px-4 py-3"
              ],
              !isMobile && "sm:text-sm px-3 py-2",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-300 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {helperText && !error && (
          <p className={cn(
            "text-gray-500",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {helperText}
          </p>
        )}
        {error && (
          <p className={cn(
            "text-red-600",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {error}
          </p>
        )}
      </div>
    )
  }
)
MobileInput.displayName = "MobileInput"

export {
  MobileForm,
  MobileFormSection,
  MobileFormField,
  MobileFormActions,
  MobileInput
}