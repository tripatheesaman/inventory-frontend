'use client'

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'white'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  default: 'text-gray-500',
  primary: 'text-blue-600',
  secondary: 'text-gray-400',
  white: 'text-white'
}

export function Spinner({ 
  className, 
  size = 'md', 
  variant = 'default',
  ...props 
}: SpinnerProps) {
  return (
    <div 
      className={cn("flex items-center justify-center", className)} 
      {...props}
    >
      <Loader2 
        className={cn(
          "animate-spin", 
          sizeClasses[size], 
          variantClasses[variant]
        )} 
      />
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
      <Spinner size="xl" />
    </div>
  )
}

export function ContentSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  )
} 