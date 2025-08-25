"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Eye, Edit3 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface JournalEditorProps {
  initialTitle?: string
  initialContent?: string
  initialTags?: string[]
  initialCategory?: string
  onSave: (entry: {
    title: string
    content: string
    tags: string[]
    category: string
  }) => void
  onCancel: () => void
  isEditing?: boolean
}

export function JournalEditor({
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  initialCategory = "",
  onSave,
  onCancel,
  isEditing = false
}: JournalEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [category, setCategory] = useState(initialCategory)
  const [isPreview, setIsPreview] = useState(false)
  const [newTag, setNewTag] = useState("")

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
    
    onSave({
      title: title.trim(),
      content: content.trim(),
      tags,
      category: category || "Ideas"
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

        <div className="grid grid-cols-2 gap-4">
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
            <div className="min-h-[300px] p-4 border border-input rounded-md bg-muted/50">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                {content || "*No content to preview*"}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your journal entry in Markdown format...

## Example:
**SOL Analysis**
- Price: $98.45
- Resistance: $100
- Support: $95

### Strategy
1. Wait for breakout above $100
2. Target: $110-115
3. Stop loss: $92"
              className="w-full h-64 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-sm"
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