"use client"

import { useState, useEffect } from 'react'
import type { JournalEntry } from '@/components/journal/journal-list'

const STORAGE_KEY = 'web3-dashboard-journal'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load entries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setEntries(parsed)
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
      } catch (error) {
        console.error('Failed to save journal entries:', error)
      }
    }
  }, [entries, isLoading])

  const addEntry = (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'excerpt'>) => {
    const newEntry: JournalEntry = {
      ...entryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      excerpt: entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : ''),
    }

    setEntries(prev => [newEntry, ...prev])
    return newEntry
  }

  const updateEntry = (id: string, entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'excerpt'>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id 
        ? {
            ...entry,
            ...entryData,
            updatedAt: new Date().toISOString(),
            excerpt: entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : ''),
          }
        : entry
    ))
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id))
  }

  const getEntry = (id: string) => {
    return entries.find(entry => entry.id === id)
  }

  const getStats = () => {
    const categoryCounts = entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tagCounts = entries.reduce((acc, entry) => {
      entry.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const thisWeekCount = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return entryDate >= weekAgo
    }).length

    return {
      totalEntries: entries.length,
      categories: Object.keys(categoryCounts).length,
      uniqueTags: Object.keys(tagCounts).length,
      thisWeekCount,
      categoryCounts,
      tagCounts,
    }
  }

  const exportEntries = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `journal-export-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importEntries = (jsonData: string) => {
    try {
      const importedEntries = JSON.parse(jsonData) as JournalEntry[]
      
      // Validate structure
      if (!Array.isArray(importedEntries)) {
        throw new Error('Invalid format: expected array of entries')
      }

      // Merge with existing entries, avoiding duplicates
      const existingIds = new Set(entries.map(e => e.id))
      const newEntries = importedEntries.filter(entry => !existingIds.has(entry.id))
      
      setEntries(prev => [...newEntries, ...prev])
      
      return {
        success: true,
        imported: newEntries.length,
        skipped: importedEntries.length - newEntries.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getStats,
    exportEntries,
    importEntries,
  }
}