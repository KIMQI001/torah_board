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
  const { error: showError, success: showSuccess } = useToast()

  // Load entries from API or local cache
  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    console.log('📖 Loading entries, auth status:', { isAuthenticated })
    
    try {
      // 先尝试从本地缓存加载，确保用户体验
      const cachedEntries = JournalService.getLocalCache()
      console.log('📖 Found cached entries:', cachedEntries.length)
      setEntries(cachedEntries)
      
      // 由于API服务已停止，直接使用本地缓存
      console.log('📖 Using cached entries only (API服务已停止):', cachedEntries.length)
      console.log('📖 Cache raw data size:', localStorage.getItem('journal_cache')?.length || 0)
      if (cachedEntries.length > 0) {
        console.log('📖 First entry content length:', cachedEntries[0]?.content?.length || 0)
        console.log('📖 First entry details:', {
          id: cachedEntries[0].id,
          title: cachedEntries[0].title,
          createdAt: cachedEntries[0].createdAt,
          folderId: cachedEntries[0].folderId
        })
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error)
      // Fallback to local cache on error
      const cachedEntries = JournalService.getLocalCache()
      setEntries(cachedEntries)
      showError('加载失败', '无法从服务器加载数据，使用本地缓存')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, showError])

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
    console.log('📖 useJournal: Initial load effect triggered')
    console.log('📖 useJournal: Current localStorage content:', localStorage.getItem('journal_cache')?.length || 0, 'bytes')
    
    // 一次性清空旧数据（仅在第一次加载时）
    const shouldClearData = localStorage.getItem('journal_data_cleared') !== 'true'
    if (shouldClearData) {
      console.log('🗑️ First time loading - clearing all old journal data...')
      JournalService.clearAllLocalData()
      setEntries([])
      setStats(null)
      
      // 强制清空localStorage中可能的其他键
      Object.keys(localStorage).forEach(key => {
        if (key.includes('journal') || key.includes('Journal')) {
          localStorage.removeItem(key)
          console.log('🗑️ Removed localStorage key:', key)
        }
      })
      
      localStorage.setItem('journal_data_cleared', 'true')
      console.log('✅ Old data cleared, marked as completed')
    }
    
    loadEntries()
    loadStats()
  }, [loadEntries, loadStats])

  // Debug: Track entries changes
  useEffect(() => {
    console.log('📖 useJournal: Entries changed, count:', entries.length)
    if (entries.length > 0) {
      console.log('📖 useJournal: First entry:', {
        id: entries[0].id,
        title: entries[0].title,
        createdAt: entries[0].createdAt
      })
    }
  }, [entries])

  // Debug: Track authentication changes
  useEffect(() => {
    console.log('📖 useJournal: Auth status changed:', { isAuthenticated })
    console.log('📖 useJournal: Current entries count:', entries.length)
  }, [isAuthenticated, entries.length])

  // 清空所有数据的函数（仅用于重置）
  const clearAllData = () => {
    console.log('🗑️ Clearing all journal data...')
    setEntries([])
    JournalService.clearAllLocalData()
    setStats(null)
    console.log('✅ All journal data cleared')
  }

  // 暴露调试函数到全局，方便调试
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { clearJournalData?: () => void }).clearJournalData = clearAllData
      ;(window as unknown as { debugJournalStorage?: () => { cached: JournalEntry[]; state: JournalEntry[] } }).debugJournalStorage = () => {
        const cached = localStorage.getItem('journal_cache')
        console.log('🔍 Debug journal storage:', {
          hasCache: !!cached,
          cacheSize: cached?.length || 0,
          cacheEntries: cached ? JSON.parse(cached).length : 0,
          currentStateEntries: entries.length,
          isAuthenticated,
          isLoading
        })
        if (cached) {
          const parsedCache = JSON.parse(cached)
          console.log('🔍 Cache content preview:', parsedCache.slice(0, 2))
        }
        return {
          cached: cached ? JSON.parse(cached) : [],
          state: entries
        }
      }
    }
  }, [entries, isAuthenticated, isLoading])

  const addEntry = async (entryData: Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt' | 'excerpt'>) => {
    try {
      setIsSyncing(true)
      console.log('📝 Adding journal entry:', {
        title: entryData.title,
        contentLength: entryData.content.length,
        folderId: entryData.folderId,
        category: entryData.category,
        tagsCount: entryData.tags.length
      })
      console.log('📝 Authentication status:', { isAuthenticated, entriesCount: entries.length })
      
      // 由于API服务已停止，直接保存到本地存储
      const newEntry: JournalEntry = {
        ...entryData,
        id: Date.now().toString(),
        walletAddress: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        excerpt: entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : ''),
        isPublic: false,
        folderId: entryData.folderId // 确保folderId被保留
      }
      
      const updatedEntries = [newEntry, ...entries]
      console.log('💾 Saving to localStorage:', {
        newEntryId: newEntry.id,
        newEntryTitle: newEntry.title,
        newEntryFolderId: newEntry.folderId,
        totalEntriesAfter: updatedEntries.length
      })
      
      setEntries(updatedEntries)
      JournalService.setLocalCache(updatedEntries)
      
      console.log('💾 Save completed, verification:', {
        stateLength: updatedEntries.length,
        cacheLength: JournalService.getLocalCache().length
      })
      
      return newEntry
    } catch (error) {
      console.error('Failed to add journal entry:', error)
      showError('添加失败', error.message || '无法添加日志条目')
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const updateEntry = async (id: string, entryData: Partial<Omit<JournalEntry, 'id' | 'walletAddress' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setIsSyncing(true)
      
      // 直接更新本地缓存
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
      console.log('💾 Updated entry in localStorage:', id)
    } catch (error) {
      console.error('Failed to update journal entry:', error)
      showError('更新失败', error.message || '无法更新日志条目')
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      setIsSyncing(true)
      
      // 直接从本地缓存删除
      const updatedEntries = entries.filter(entry => entry.id !== id)
      setEntries(updatedEntries)
      JournalService.setLocalCache(updatedEntries)
      console.log('💾 Deleted entry from localStorage:', id)
    } catch (error) {
      console.error('Failed to delete journal entry:', error)
      showError('删除失败', error.message || '无法删除日志条目')
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
      
      showSuccess('导出成功', `已导出 ${exportData.length} 条日志记录`)
    } catch (error) {
      console.error('Failed to export journal entries:', error)
      showError('导出失败', error.message || '无法导出日志条目')
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
        
        showSuccess('导入完成', `成功导入 ${imported} 条记录${failed > 0 ? `，失败 ${failed} 条` : ''}`)
        
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
        
        showSuccess('导入完成', `成功导入 ${newEntries.length} 条记录到本地缓存`)
        
        return {
          success: true,
          imported: newEntries.length,
          skipped: importedEntries.length - newEntries.length
        }
      }
    } catch (error) {
      console.error('Failed to import journal entries:', error)
      showError('导入失败', error instanceof Error ? error.message : '未知错误')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // 同步功能已停用（API服务已停止）
  const syncToServer = async () => {
    console.log('📡 Sync to server disabled (API service stopped)')
    return
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