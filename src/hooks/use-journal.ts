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
  const { isAuthenticated, user } = useAuth()
  const { error: showError, success: showSuccess } = useToast()
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null)
  
  // 从user对象中获取钱包地址
  const walletAddress = user?.walletAddress || null

  // Load entries from API or local cache
  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    console.log('📖 Loading entries, auth status:', { isAuthenticated, walletAddress })
    
    try {
      // 在开发环境总是尝试从API加载，不管认证状态
      if (isAuthenticated || process.env.NODE_ENV === 'development') {
        console.log('📖 Fetching from server...')
        const result = await JournalService.getEntries()
        console.log('📖 Server data loaded:', result.entries.length)
        
        setEntries(result.entries)
        // 更新本地缓存
        JournalService.setLocalCache(result.entries)
        
        console.log('📖 Successfully loaded from server and updated cache')
      } else {
        // 未认证时使用本地缓存
        console.log('📖 Not authenticated, loading from cache...')
        const cachedEntries = JournalService.getLocalCache()
        console.log('📖 Found cached entries:', cachedEntries.length)
        setEntries(cachedEntries)
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error)
      // Fallback to local cache on error
      const cachedEntries = JournalService.getLocalCache()
      setEntries(cachedEntries)
      console.log('📖 Fallback to cache due to error:', cachedEntries.length)
      showError('服务器连接失败', '已切换到本地缓存数据')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, walletAddress, showError])

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

  // 钱包地址变化检测和数据清理
  useEffect(() => {
    console.log('🔑 Wallet address changed:', { 
      previous: currentWalletAddress, 
      current: walletAddress,
      isAuthenticated 
    });

    // 检查钱包地址是否发生变化
    if (currentWalletAddress && currentWalletAddress !== walletAddress) {
      console.log('🔄 Wallet address changed, clearing previous user data...')
      // 钱包地址发生变化，清理前一个用户的数据
      JournalService.clearAllLocalData()
      setEntries([])
      setStats(null)
    }
    
    // 更新当前钱包地址状态
    setCurrentWalletAddress(walletAddress)
    
    // 更新localStorage中的钱包地址（用于API认证）
    if (typeof window !== 'undefined') {
      if (walletAddress) {
        localStorage.setItem('wallet_address', walletAddress)
      } else {
        localStorage.removeItem('wallet_address')
      }
    }
  }, [walletAddress, currentWalletAddress])

  // 钱包断开时清理数据
  useEffect(() => {
    if (!isAuthenticated && currentWalletAddress) {
      console.log('👋 Wallet disconnected, clearing all journal data...')
      JournalService.clearAllLocalData()
      setEntries([])
      setStats(null)
      setCurrentWalletAddress(null)
      
      // 移除认证信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet_address')
      }
    }
  }, [isAuthenticated, currentWalletAddress])

  // Initial load
  useEffect(() => {
    console.log('📖 useJournal: Initial load effect triggered')
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
      
      let newEntry: JournalEntry
      
      if (isAuthenticated || process.env.NODE_ENV === 'development') {
        // 优先保存到服务器
        console.log('📝 Saving to server...')
        newEntry = await JournalService.createEntry(entryData)
        console.log('📝 Server save successful:', newEntry.id)
      } else {
        // 未认证时保存到本地存储
        console.log('📝 Not authenticated, saving to local storage...')
        newEntry = {
          ...entryData,
          id: Date.now().toString(),
          walletAddress: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          excerpt: entryData.content.slice(0, 150) + (entryData.content.length > 150 ? '...' : ''),
          isPublic: false,
          folderId: entryData.folderId
        }
      }
      
      // 更新本地状态和缓存
      const updatedEntries = [newEntry, ...entries]
      setEntries(updatedEntries)
      JournalService.setLocalCache(updatedEntries)
      
      console.log('📝 Entry added successfully:', {
        id: newEntry.id,
        title: newEntry.title,
        source: isAuthenticated ? 'server' : 'local'
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
      
      if (isAuthenticated || process.env.NODE_ENV === 'development') {
        // 优先更新到服务器
        console.log('🔄 Updating entry on server:', id)
        await JournalService.updateEntry(id, entryData)
        console.log('🔄 Server update successful')
      }
      
      // 更新本地状态和缓存
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
      
      console.log('🔄 Entry updated successfully:', {
        id,
        source: isAuthenticated ? 'server' : 'local'
      })
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
      
      if (isAuthenticated || process.env.NODE_ENV === 'development') {
        // 优先从服务器删除
        console.log('🗑️ Deleting entry from server:', id)
        await JournalService.deleteEntry(id)
        console.log('🗑️ Server deletion successful')
      }
      
      // 从本地状态和缓存删除
      const updatedEntries = entries.filter(entry => entry.id !== id)
      setEntries(updatedEntries)
      JournalService.setLocalCache(updatedEntries)
      
      console.log('🗑️ Entry deleted successfully:', {
        id,
        source: isAuthenticated ? 'server' : 'local'
      })
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