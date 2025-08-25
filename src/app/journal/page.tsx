"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Calendar, Tag, Filter, Download, Upload } from "lucide-react"
import { JournalEditor } from "@/components/journal/journal-editor"
import { JournalList } from "@/components/journal/journal-list"
import { JournalViewer } from "@/components/journal/journal-viewer"
import { useJournal } from "@/hooks/use-journal"
import type { JournalEntry } from "@/components/journal/journal-list"

type ViewMode = 'list' | 'editor' | 'viewer'

export default function JournalPage() {
  const {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getStats,
    exportEntries,
    importEntries,
  } = useJournal()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)

  const stats = getStats()

  const handleNewEntry = () => {
    setEditingEntry(null)
    setViewMode('editor')
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setViewMode('editor')
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setViewingEntry(entry)
    setViewMode('viewer')
  }

  const handleSave = (entryData: {
    title: string
    content: string
    tags: string[]
    category: string
  }) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, entryData)
    } else {
      addEntry(entryData)
    }
    setViewMode('list')
    setEditingEntry(null)
  }

  const handleCancel = () => {
    setViewMode('list')
    setEditingEntry(null)
    setViewingEntry(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(id)
      if (viewMode === 'viewer') {
        setViewMode('list')
        setViewingEntry(null)
      }
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          const result = importEntries(content)
          if (result.success) {
            alert(`Successfully imported ${result.imported} entries`)
          } else {
            alert(`Import failed: ${result.error}`)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading journal...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Journal</h1>
              <p className="text-muted-foreground">
                Document your trading thoughts, strategies, and market analysis
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={exportEntries} disabled={entries.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleNewEntry}>
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.categories}</div>
                <p className="text-xs text-muted-foreground">Organized topics</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tags Used</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueTags}</div>
                <p className="text-xs text-muted-foreground">Unique tags</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeekCount}</div>
                <p className="text-xs text-muted-foreground">New entries</p>
              </CardContent>
            </Card>
          </div>

          <JournalList
            entries={entries}
            onEdit={handleEditEntry}
            onDelete={handleDelete}
            onView={handleViewEntry}
          />
        </>
      )}

      {viewMode === 'editor' && (
        <JournalEditor
          initialTitle={editingEntry?.title}
          initialContent={editingEntry?.content}
          initialTags={editingEntry?.tags}
          initialCategory={editingEntry?.category}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={!!editingEntry}
        />
      )}

      {viewMode === 'viewer' && viewingEntry && (
        <JournalViewer
          entry={viewingEntry}
          onEdit={() => handleEditEntry(viewingEntry)}
          onDelete={() => handleDelete(viewingEntry.id)}
          onBack={handleCancel}
        />
      )}
    </div>
  )
}