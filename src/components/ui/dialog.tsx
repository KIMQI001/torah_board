"use client"

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface DialogTriggerProps {
  className?: string
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false)
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  return (
    <div className={`relative ${className || ''}`}>
      {children}
    </div>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={`p-6 pb-4 ${className || ''}`}>
      {children}
    </div>
  )
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}>
      {children}
    </h2>
  )
}

const DialogFooter: React.FC<DialogFooterProps> = ({ className, children }) => {
  return (
    <div className={`p-6 pt-4 flex justify-end space-x-2 ${className || ''}`}>
      {children}
    </div>
  )
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children }) => {
  return (
    <p className={`text-sm text-muted-foreground ${className || ''}`}>
      {children}
    </p>
  )
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ className, children, onClick, asChild = false }) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick,
      className: `${(children as React.ReactElement).props.className || ''} ${className || ''}`.trim()
    })
  }
  
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger }