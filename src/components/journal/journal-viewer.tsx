"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2, ArrowLeft } from "lucide-react"
import { ImageViewer } from "./image-viewer"
import type { JournalEntry } from './journal-list'

interface JournalViewerProps {
  entry: JournalEntry
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

export function JournalViewer({ entry, onEdit, onDelete, onBack }: JournalViewerProps) {
  const [viewingImage, setViewingImage] = useState<{ src: string; alt?: string } | null>(null)
  const [restoredContent, setRestoredContent] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  // 直接使用内容，不进行IndexedDB恢复
  useEffect(() => {
    const content = entry.content || ''
    console.log('📖 JournalViewer: Setting content, length:', content.length)
    setRestoredContent(content)
  }, [entry.content])

  useEffect(() => {
    if (contentRef.current) {
      // 为所有图片添加点击事件
      const images = contentRef.current.querySelectorAll('img')
      images.forEach((img) => {
        img.style.cursor = 'pointer'
        img.style.transition = 'transform 0.2s'
        img.addEventListener('mouseover', () => {
          img.style.transform = 'scale(1.05)'
        })
        img.addEventListener('mouseout', () => {
          img.style.transform = 'scale(1)'
        })
        img.addEventListener('click', () => {
          setViewingImage({ 
            src: img.src, 
            alt: img.alt || 'Image' 
          })
        })
      })

      // 清理函数
      return () => {
        images.forEach((img) => {
          img.replaceWith(img.cloneNode(true))
        })
      }
    }
  }, [restoredContent])

  return (
    <>
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <CardTitle className="text-2xl">{entry.title}</CardTitle>
        <div className="text-sm text-muted-foreground flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span>Created: {new Date(entry.createdAt).toLocaleDateString()}</span>
            {entry.updatedAt !== entry.createdAt && (
              <span>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {entry.category}
            </span>
            
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          ref={contentRef}
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: restoredContent }}
        />
      </CardContent>
    </Card>
    
    {/* 图片查看器 */}
    {viewingImage && (
      <ImageViewer
        src={viewingImage.src}
        alt={viewingImage.alt}
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
      />
    )}
    </>
  )
}