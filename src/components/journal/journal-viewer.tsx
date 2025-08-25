"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2, ArrowLeft } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { JournalEntry } from './journal-list'

interface JournalViewerProps {
  entry: JournalEntry
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

export function JournalViewer({ entry, onEdit, onDelete, onBack }: JournalViewerProps) {
  return (
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
        <CardDescription className="flex flex-col space-y-2">
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
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {entry.content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}