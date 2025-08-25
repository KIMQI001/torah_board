"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2, Search, Filter } from "lucide-react"

export interface JournalEntry {
  id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  createdAt: string
  updatedAt: string
}

interface JournalListProps {
  entries: JournalEntry[]
  onEdit: (entry: JournalEntry) => void
  onDelete: (id: string) => void
  onView: (entry: JournalEntry) => void
}

export function JournalList({ entries, onEdit, onDelete, onView }: JournalListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTag, setSelectedTag] = useState("")

  const categories = [...new Set(entries.map(entry => entry.category))].filter(Boolean)
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))]

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || entry.category === selectedCategory
    const matchesTag = !selectedTag || entry.tags.includes(selectedTag)

    return matchesSearch && matchesCategory && matchesTag
  })

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="min-w-[150px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px]">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {(searchQuery || selectedCategory || selectedTag) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("")
                  setSelectedTag("")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                {entries.length === 0 ? (
                  <div>
                    <p className="text-lg mb-2">No journal entries yet</p>
                    <p>Start documenting your trading journey!</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">No entries match your filters</p>
                    <p>Try adjusting your search criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:bg-accent/50 cursor-pointer transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1" onClick={() => onView(entry)}>
                    <CardTitle className="text-lg mb-2">{entry.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {entry.excerpt}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(entry)
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(entry.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {entry.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}