"use client"

import { useState, useEffect, useCallback } from 'react'
import { JournalService, type JournalEntry, type JournalStats } from '@/services/journal.service'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [stats, setStats] = useState<JournalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Load entries from API or local cache
  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isAuthenticated) {
        // Load from API if authenticated
        const { entries: apiEntries } = await JournalService.getEntries()
        setEntries(apiEntries)
        // Update local cache
        JournalService.setLocalCache(apiEntries)
      } else {
        // Load from local cache if not authenticated
        const cachedEntries = JournalService.getLocalCache()
        setEntries(cachedEntries)
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error)
      // Fallback to local cache on error
      const cachedEntries = JournalService.getLocalCache()
      setEntries(cachedEntries)
      toast({
        title: '加载失败',
        description: '无法从服务器加载数据，使用本地缓存',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, toast])

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const statsData = await JournalService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load journal stats:', error)
    }
  }, [isAuthenticated])

  // Initial load
  useEffect(() => {
    loadEntries()
    loadStats()
  }, [loadEntries, loadStats])

  const addEntry = async (entryData: Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt' | 'excerpt'>) => {
    try {
      setIsSyncing(true)
      
      if (isAuthenticated) {
        // Save to API if authenticated
        const newEntry = await JournalService.createEntry(entryData)
        setEntries(prev => [newEntry, ...prev])
        // Update local cache
        JournalService.setLocalCache([newEntry, ...entries])
        await loadStats() // Refresh stats
        return newEntry
      } else {
        // Save to local cache only if not authenticated
        const newEntry: JournalEntry = {
          ...entryData,
          id: Date.now().toString(),
          walletAddress: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          excerpt: entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : ''),
          isPublic: false
        }
        const updatedEntries = [newEntry, ...entries]
        setEntries(updatedEntries)
        JournalService.setLocalCache(updatedEntries)
        return newEntry
      }
    } catch (error) {
      console.error('Failed to add journal entry:', error)
      toast({
        title: '添加失败',
        description: error.message || '无法添加日志条目',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const updateEntry = async (id: string, entryData: Partial<Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setIsSyncing(true)
      
      if (isAuthenticated) {
        // Update via API if authenticated
        const updatedEntry = await JournalService.updateEntry(id, entryData)
        setEntries(prev => prev.map(entry => 
          entry.id === id ? updatedEntry : entry
        ))
        // Update local cache
        const updatedEntries = entries.map(entry => 
          entry.id === id ? updatedEntry : entry
        )
        JournalService.setLocalCache(updatedEntries)
      } else {
        // Update local cache only if not authenticated
        const updatedEntries = entries.map(entry => 
          entry.id === id 
            ? {
                ...entry,
                ...entryData,
                updatedAt: new Date().toISOString(),
                excerpt: entryData.content ? 
                  entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : '') :
                  entry.excerpt
              }
            : entry
        )
        setEntries(updatedEntries)
        JournalService.setLocalCache(updatedEntries)
      }
    } catch (error) {
      console.error('Failed to update journal entry:', error)
      toast({
        title: '更新失败',
        description: error.message || '无法更新日志条目',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      setIsSyncing(true)
      
      if (isAuthenticated) {
        // Delete via API if authenticated
        await JournalService.deleteEntry(id)
        setEntries(prev => prev.filter(entry => entry.id !== id))
        // Update local cache
        const updatedEntries = entries.filter(entry => entry.id !== id)
        JournalService.setLocalCache(updatedEntries)
        await loadStats() // Refresh stats
      } else {
        // Delete from local cache only if not authenticated
        const updatedEntries = entries.filter(entry => entry.id !== id)
        setEntries(updatedEntries)
        JournalService.setLocalCache(updatedEntries)
      }
    } catch (error) {
      console.error('Failed to delete journal entry:', error)
      toast({
        title: '删除失败',
        description: error.message || '无法删除日志条目',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const getEntry = (id: string) => {
    return entries.find(entry => entry.id === id)
  }

  const getStats = () => {
    if (stats) {
      return stats
    }
    
    // Calculate stats locally if not available from API
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
      thisWeekCount,
      categories: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
      sentiment: [],
      categoryCounts,
      tagCounts,
      uniqueTags: Object.keys(tagCounts).length
    }
  }

  const exportEntries = async () => {
    try {
      setIsSyncing(true)
      
      let exportData: JournalEntry[]
      if (isAuthenticated) {
        // Export from API if authenticated
        exportData = await JournalService.exportEntries()
      } else {
        // Export from local cache if not authenticated
        exportData = entries
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `journal-export-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast({
        title: '导出成功',
        description: `已导出 ${exportData.length} 条日志记录`
      })
    } catch (error) {
      console.error('Failed to export journal entries:', error)
      toast({
        title: '导出失败',
        description: error.message || '无法导出日志条目',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const importEntries = async (jsonData: string) => {
    try {
      setIsSyncing(true)
      
      const importedEntries = JSON.parse(jsonData) as JournalEntry[]
      
      // Validate structure
      if (!Array.isArray(importedEntries)) {
        throw new Error('Invalid format: expected array of entries')
      }

      if (isAuthenticated) {
        // Import via API if authenticated
        const { imported, failed } = await JournalService.importEntries(
          importedEntries.map(entry => ({
            title: entry.title,
            content: entry.content,
            category: entry.category,
            tags: entry.tags,
            tradeData: entry.tradeData,
            imageUrls: entry.imageUrls,
            isPublic: entry.isPublic || false,
            sentiment: entry.sentiment
          }))
        )
        
        // Reload entries after import
        await loadEntries()
        await loadStats()
        
        toast({
          title: '导入完成',
          description: `成功导入 ${imported} 条记录${failed > 0 ? `，失败 ${failed} 条` : ''}`
        })
        
        return {
          success: true,
          imported,
          skipped: failed
        }
      } else {
        // Import to local cache if not authenticated
        const existingIds = new Set(entries.map(e => e.id))
        const newEntries = importedEntries.filter(entry => !existingIds.has(entry.id))
        
        const updatedEntries = [...newEntries, ...entries]
        setEntries(updatedEntries)
        JournalService.setLocalCache(updatedEntries)
        
        toast({
          title: '导入完成',
          description: `成功导入 ${newEntries.length} 条记录到本地缓存`
        })
        
        return {
          success: true,
          imported: newEntries.length,
          skipped: importedEntries.length - newEntries.length
        }
      }
    } catch (error) {
      console.error('Failed to import journal entries:', error)
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Sync local entries to server when authenticated
  const syncToServer = async () => {
    if (!isAuthenticated) return
    
    try {
      setIsSyncing(true)
      const localEntries = JournalService.getLocalCache()
      const localOnlyEntries = localEntries.filter(entry => entry.walletAddress === 'local')
      
      if (localOnlyEntries.length > 0) {
        const { imported, failed } = await JournalService.importEntries(
          localOnlyEntries.map(entry => ({
            title: entry.title,
            content: entry.content,
            category: entry.category,
            tags: entry.tags,
            tradeData: entry.tradeData,
            imageUrls: entry.imageUrls,
            isPublic: false,
            sentiment: entry.sentiment
          }))
        )
        
        if (imported > 0) {
          await loadEntries()
          await loadStats()
          toast({
            title: '同步成功',
            description: `已将 ${imported} 条本地记录同步到服务器`
          })
        }
      }
    } catch (error) {
      console.error('Failed to sync to server:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-sync when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      syncToServer()
    }
  }, [isAuthenticated, isLoading])

  return {
    entries,
    isLoading,
    isSyncing,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getStats,
    exportEntries,
    importEntries,
    refresh: loadEntries,
    syncToServer
  }
}