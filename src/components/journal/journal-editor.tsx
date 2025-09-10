"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Eye, Edit3 } from "lucide-react"
import { RichEditor } from "@/components/journal/rich-editor"

interface JournalFolder {
  id: string
  name: string
  icon: string
  color: string
}

interface JournalEditorProps {
  initialTitle?: string
  initialContent?: string
  initialTags?: string[]
  initialCategory?: string
  initialFolderId?: string
  folders?: JournalFolder[]
  currentFolder?: JournalFolder | null // 当前所在的文件夹
  onSave: (entry: {
    title: string
    content: string
    tags: string[]
    category: string
    folderId?: string
    excerpt?: string
  }) => void
  onCancel: () => void
  isEditing?: boolean
}

export function JournalEditor({
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  initialCategory = "",
  initialFolderId = "",
  folders = [],
  currentFolder = null,
  onSave,
  onCancel,
  isEditing = false
}: JournalEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [category, setCategory] = useState(initialCategory)
  // 如果在特定文件夹内创建新日志，默认选择当前文件夹
  const [folderId, setFolderId] = useState(initialFolderId || (currentFolder && !isEditing ? currentFolder.id : ""))
  const [isPreview, setIsPreview] = useState(false)
  const [newTag, setNewTag] = useState("")

  // 从HTML内容生成纯文本摘要
  const generateExcerpt = (htmlContent: string): string => {
    // 创建临时DOM元素来提取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // 替换图片为[图片]文本
    tempDiv.querySelectorAll('img').forEach(img => {
      const textNode = document.createTextNode('[图片]')
      img.replaceWith(textNode)
    })
    
    // 获取纯文本
    const plainText = (tempDiv.textContent || tempDiv.innerText || '').trim()
    
    // 截取前150个字符
    return plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText
  }

  const categories = [
    "Trading Strategy",
    "Market Research", 
    "Portfolio Management",
    "Research",
    "Ideas",
    "Analysis"
  ]

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    
    const trimmedContent = content.trim()
    const excerpt = generateExcerpt(trimmedContent)
    
    onSave({
      title: title.trim(),
      content: trimmedContent,
      tags,
      category: category || "Ideas",
      folderId: folderId || undefined,
      excerpt
    })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }


  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEditing ? "Edit Journal Entry" : "New Journal Entry"}</span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {isPreview ? "Preview your journal entry" : "Write your thoughts, strategies, and market insights"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter journal entry title..."
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isPreview}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isPreview}
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">文件夹</label>
            {currentFolder && !isEditing ? (
              // 如果在特定文件夹内创建新日志，显示当前文件夹信息
              <div 
                className="w-full px-3 py-2 border border-input bg-muted rounded-md flex items-center"
                style={{ backgroundColor: `${currentFolder.color}10` }}
              >
                <span className="mr-2 text-lg">{currentFolder.icon}</span>
                <span className="font-medium" style={{ color: currentFolder.color }}>
                  {currentFolder.name}
                </span>
              </div>
            ) : (
              // 编辑时或在根目录时显示选择器
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isPreview}
              >
                <option value="">根目录</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                disabled={isPreview}
              />
              <Button 
                size="sm" 
                onClick={addTag}
                disabled={isPreview || !newTag.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-muted rounded-md text-xs flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    {!isPreview && (
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          {isPreview ? (
            <div 
              className="min-h-[300px] p-4 border border-input rounded-md bg-muted/50 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: content || '<em>No content to preview</em>' 
              }}
            />
          ) : (
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Write your journal entry here. You can paste images directly..."
            />
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Update Entry" : "Save Entry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}