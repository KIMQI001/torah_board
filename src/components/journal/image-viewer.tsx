"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setScale(1)
      setRotation(0)
      setImageLoaded(false)
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, src])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDoubleClick = () => {
    // 双击切换放大/还原
    if (scale === 1) {
      setScale(2) // 放大到200%
    } else {
      setScale(1) // 还原到100%
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            handleZoomOut()
          }}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            handleZoomIn()
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            handleRotate()
          }}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div 
        className="relative max-w-[95vw] max-h-[95vh] overflow-auto rounded-lg bg-white/5 backdrop-blur-sm p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt || "Image"}
          onLoad={() => setImageLoaded(true)}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: scale === 1 ? 'zoom-in' : 'zoom-out',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
            maxWidth: scale > 1 ? 'none' : '100%', // 放大时不限制宽度
            maxHeight: scale > 1 ? 'none' : '90vh', // 放大时不限制高度
            objectFit: 'contain',
            imageRendering: 'high-quality', // 提高图像渲染质量
            WebkitImageRendering: 'high-quality', // Safari 支持
            opacity: imageLoaded ? 1 : 0, // 加载完成前隐藏
            filter: 'none' // 确保没有滤镜影响图片质量
          }}
        />
        
        {/* 加载指示器 */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  )
}