"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Calendar, Tag, Filter, Download, Upload, FolderPlus, Trash2, Folder, AlertCircle } from "lucide-react"
import { JournalEditor } from "@/components/journal/journal-editor"
import { JournalList } from "@/components/journal/journal-list"
import { JournalViewer } from "@/components/journal/journal-viewer"
import { FolderCards, JournalFolder, CreateFolderModal } from "@/components/journal/folder-cards"
import { JournalFolderService } from "@/services/journal-folder.service"
import { useJournal } from "@/hooks/use-journal"
import type { JournalEntry } from "@/components/journal/journal-list"

type ViewMode = 'folders' | 'folder-content' | 'editor' | 'viewer'

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

  const [viewMode, setViewMode] = useState<ViewMode>('folders')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)
  
  // 文件夹相关状态
  const [folders, setFolders] = useState<JournalFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string; type: 'folder' | 'entry' }>({
    show: false,
    id: '',
    name: '',
    type: 'folder'
  })

  const stats = getStats()

  // 加载文件夹
  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      setFoldersLoading(true)
      const folderList = await JournalFolderService.getFolders()
      setFolders(folderList)
    } catch (error) {
      console.error('Failed to load folders:', error)
    } finally {
      setFoldersLoading(false)
    }
  }

  // 文件夹管理函数
  const handleCreateFolder = async (folderData: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>, folderType?: 'project' | 'investment') => {
    try {
      // 根据文件夹类型自动添加相应的关键词到描述中
      const enhancedData = { ...folderData }
      if (folderType === 'project' && !folderData.description?.includes('项目')) {
        enhancedData.description = folderData.description ? `${folderData.description} - 项目相关` : '项目相关文件夹'
      } else if (folderType === 'investment' && !folderData.description?.includes('投资') && !folderData.description?.includes('交易')) {
        enhancedData.description = folderData.description ? `${folderData.description} - 投资交易` : '投资交易相关文件夹'
      }
      
      await JournalFolderService.createFolder(enhancedData)
      loadFolders() // 重新加载文件夹列表
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('创建文件夹失败')
    }
  }
  
  // 添加状态管理文件夹创建类型
  const [folderType, setFolderType] = useState<'project' | 'investment' | null>(null)

  const handleUpdateFolder = async (id: string, folderData: Partial<JournalFolder>) => {
    try {
      await JournalFolderService.updateFolder(id, folderData)
      loadFolders() // 重新加载文件夹列表
    } catch (error) {
      console.error('Failed to update folder:', error)
      alert('更新文件夹失败')
    }
  }

  const handleDeleteFolder = (id: string, name?: string) => {
    setDeleteConfirm({
      show: true,
      id,
      name: name || '此文件夹',
      type: 'folder'
    })
  }
  
  const confirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'folder') {
        await JournalFolderService.deleteFolder(deleteConfirm.id)
        loadFolders() // 重新加载文件夹列表
        // 如果删除的是当前选中的文件夹，重置选择
        if (selectedFolderId === deleteConfirm.id) {
          setSelectedFolderId(null)
        }
      } else {
        deleteEntry(deleteConfirm.id)
        if (viewMode === 'viewer') {
          setViewMode(selectedFolderId ? 'folder-content' : 'folders')
          setViewingEntry(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert(`删除${deleteConfirm.type === 'folder' ? '文件夹' : '日志'}失败`)
    } finally {
      setDeleteConfirm({ show: false, id: '', name: '', type: 'folder' })
    }
  }

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId)
    setViewMode('folder-content')
  }

  const handleBackToFolders = () => {
    setSelectedFolderId(null)
    setViewMode('folders')
  }

  // 根据选中的文件夹过滤日志条目
  const filteredEntries = selectedFolderId 
    ? entries.filter(entry => entry.folderId === selectedFolderId)
    : entries // 没有选择文件夹时显示所有条目

  // Debug: 统计调试信息
  const entriesWithFolders = entries.filter(entry => entry.folderId)
  const entriesWithoutFolders = entries.filter(entry => !entry.folderId)
  const folderEntryTotals = folders.reduce((total, folder) => {
    return total + entries.filter(entry => entry.folderId === folder.id).length
  }, 0)
  
  console.log('📊 Statistics debug:', {
    totalEntries: entries.length,
    entriesWithFolders: entriesWithFolders.length,
    entriesWithoutFolders: entriesWithoutFolders.length,
    folderEntryTotals,
    foldersCount: folders.length
  })

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
    folderId?: string
    excerpt?: string
  }) => {
    // 确保新建日志时必须指定文件夹ID
    const finalFolderId = entryData.folderId || selectedFolderId;
    
    // 如果仍然没有文件夹ID，强制要求选择文件夹
    if (!finalFolderId && folders.length > 0) {
      alert('请选择一个文件夹来保存日志');
      return;
    }
    
    const finalEntryData = {
      ...entryData,
      folderId: finalFolderId
    }
    
    console.log('💾 Saving journal entry:', {
      title: finalEntryData.title,
      folderId: finalEntryData.folderId,
      contentLength: finalEntryData.content.length,
      isEditing: !!editingEntry
    })
    
    if (editingEntry) {
      updateEntry(editingEntry.id, finalEntryData)
    } else {
      addEntry(finalEntryData)
    }
    setViewMode('folder-content')
    setEditingEntry(null)
  }

  const handleCancel = () => {
    // 如果有选中的文件夹，返回文件夹内容页，否则返回文件夹首页
    setViewMode(selectedFolderId ? 'folder-content' : 'folders')
    setEditingEntry(null)
    setViewingEntry(null)
  }

  const handleDelete = (id: string) => {
    const entry = entries.find(e => e.id === id)
    setDeleteConfirm({
      show: true,
      id,
      name: entry?.title || '此日志',
      type: 'entry'
    })
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
    <div className="space-y-6 flex flex-col min-h-screen">
      {/* 文件夹首页 */}
      {viewMode === 'folders' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">交易日志</h1>
              <p className="text-muted-foreground">
                记录交易思路、策略分析和市场观察
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleImport} className="cursor-pointer hover:cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" onClick={exportEntries} disabled={entries.length === 0} className="cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">文件夹日志</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{folderEntryTotals}</div>
                <p className="text-xs text-muted-foreground">已分类</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">未分类日志</CardTitle>
                <BookOpen className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{entriesWithoutFolders.length}</div>
                <p className="text-xs text-muted-foreground">待整理</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">文件夹数</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{folders.length}</div>
                <p className="text-xs text-muted-foreground">分类整理</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">标签数</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueTags}</div>
                <p className="text-xs text-muted-foreground">不同标签</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本周新增</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeekCount}</div>
                <p className="text-xs text-muted-foreground">新日志</p>
              </CardContent>
            </Card>
          </div>


          <div className="grid gap-6 md:grid-cols-2">
            {/* 项目日志 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>项目日志</CardTitle>
                    <CardDescription>
                      记录项目研究、技术分析和开发进展
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setFolderType('project')
                      setShowCreateFolderModal(true)
                    }}
                    className="cursor-pointer hover:cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加文件夹
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                  {folders
                    .filter(folder => folder.name.includes('项目') || folder.description?.includes('项目') || 
                             folder.name.includes('技术') || folder.description?.includes('技术') ||
                             folder.name.includes('开发') || folder.description?.includes('开发'))
                    .map((folder) => {
                      // 动态计算该文件夹的日志数量
                      const folderEntryCount = entries.filter(entry => entry.folderId === folder.id).length;
                      
                      return (
                      <div key={folder.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                              <Folder className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{folder.name}</h3>
                              <p className="text-sm text-muted-foreground break-words overflow-hidden">{folder.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(folder.id, folder.name)
                              }}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 p-1 h-8 w-8 transition-colors cursor-pointer hover:cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">日志数</p>
                            <p className="font-medium">{folderEntryCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">标签</p>
                            <p className="font-medium">{stats.uniqueTags}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">更新时间</p>
                            <p className="font-medium text-xs">{new Date(folder.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm px-2 py-1 rounded-md" style={{ backgroundColor: `${folder.color}10`, color: folder.color }}>
                            {folder.icon || '📁'} {folder.category || '默认'}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectFolder(folder.id)}
                            className="cursor-pointer hover:cursor-pointer"
                          >
                            查看日志
                          </Button>
                        </div>
                      </div>
                      )
                    })}
                  
                  {folders.filter(folder => folder.name.includes('项目') || folder.description?.includes('项目') || 
                                   folder.name.includes('技术') || folder.description?.includes('技术') ||
                                   folder.name.includes('开发') || folder.description?.includes('开发')).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无项目日志文件夹</p>
                      <p className="text-sm mb-4">创建文件夹来整理项目相关的日志</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 投资日志 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>投资日志</CardTitle>
                    <CardDescription>
                      记录交易策略、市场分析和投资心得
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setFolderType('investment')
                      setShowCreateFolderModal(true)
                    }}
                    className="cursor-pointer hover:cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加文件夹
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                  {folders
                    .filter(folder => folder.name.includes('投资') || folder.description?.includes('投资') || 
                             folder.name.includes('交易') || folder.description?.includes('交易') ||
                             folder.name.includes('策略') || folder.description?.includes('策略') ||
                             folder.name.includes('市场') || folder.description?.includes('市场') ||
                             (!folder.name.includes('项目') && !folder.description?.includes('项目') && 
                              !folder.name.includes('技术') && !folder.description?.includes('技术') &&
                              !folder.name.includes('开发') && !folder.description?.includes('开发')))
                    .map((folder) => {
                      // 动态计算该文件夹的日志数量
                      const folderEntryCount = entries.filter(entry => entry.folderId === folder.id).length;
                      
                      return (
                      <div key={folder.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                              <Folder className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{folder.name}</h3>
                              <p className="text-sm text-muted-foreground break-words overflow-hidden">{folder.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(folder.id, folder.name)
                              }}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 p-1 h-8 w-8 transition-colors cursor-pointer hover:cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">日志数</p>
                            <p className="font-medium">{folderEntryCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">标签</p>
                            <p className="font-medium">{stats.uniqueTags}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">更新时间</p>
                            <p className="font-medium text-xs">{new Date(folder.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm px-2 py-1 rounded-md" style={{ backgroundColor: `${folder.color}10`, color: folder.color }}>
                            {folder.icon || '📁'} {folder.category || '默认'}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectFolder(folder.id)}
                            className="cursor-pointer hover:cursor-pointer"
                          >
                            查看日志
                          </Button>
                        </div>
                      </div>
                      )
                    })}
                  
                  {folders.filter(folder => folder.name.includes('投资') || folder.description?.includes('投资') || 
                                   folder.name.includes('交易') || folder.description?.includes('交易') ||
                                   folder.name.includes('策略') || folder.description?.includes('策略') ||
                                   folder.name.includes('市场') || folder.description?.includes('市场') ||
                                   (!folder.name.includes('项目') && !folder.description?.includes('项目') && 
                                    !folder.name.includes('技术') && !folder.description?.includes('技术') &&
                                    !folder.name.includes('开发') && !folder.description?.includes('开发'))).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无投资日志文件夹</p>
                      <p className="text-sm mb-4">创建文件夹来整理交易相关的日志</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 文件夹内容页面 */}
      {viewMode === 'folder-content' && selectedFolderId && (
        <>
          {(() => {
            const folder = folders.find(f => f.id === selectedFolderId)
            const folderEntries = filteredEntries
            const folderStats = {
              totalEntries: folderEntries.length,
              recentEntries: folderEntries.filter(entry => {
                const entryDate = new Date(entry.createdAt)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return entryDate >= weekAgo
              }).length,
              categories: [...new Set(folderEntries.map(entry => entry.category))].filter(Boolean).length,
              tags: [...new Set(folderEntries.flatMap(entry => entry.tags))].length
            }

            return (
              <>
                {/* 文件夹头部信息 */}
                <div className="space-y-6">
                  <div className="flex justify-start items-start">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="ghost" 
                        onClick={handleBackToFolders} 
                        className="cursor-pointer hover:cursor-pointer hover:bg-accent"
                      >
                        ← 返回文件夹
                      </Button>
                    </div>
                  </div>

                  {/* 文件夹信息卡片 */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                            style={{ backgroundColor: `${folder?.color || '#3B82F6'}20` }}
                          >
                            {folder?.icon || '📁'}
                          </div>
                          <div>
                            <h1 className="text-3xl font-bold mb-2">{folder?.name || '文件夹'}</h1>
                            {folder?.description && (
                              <p className="text-muted-foreground max-w-lg">{folder.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="text-sm text-muted-foreground">
                                创建于 {folder ? new Date(folder.createdAt).toLocaleDateString() : ''}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                最后更新 {folder ? new Date(folder.updatedAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {folder && (
                          <div 
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                          >
                            {folder.category || '默认分类'}
                          </div>
                        )}
                      </div>

                      {/* 统计信息 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{folderStats.totalEntries}</div>
                          <div className="text-sm text-muted-foreground">总日志数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{folderStats.recentEntries}</div>
                          <div className="text-sm text-muted-foreground">本周新增</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{folderStats.categories}</div>
                          <div className="text-sm text-muted-foreground">分类数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{folderStats.tags}</div>
                          <div className="text-sm text-muted-foreground">标签数</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 日志列表 */}
                <JournalList
                  entries={filteredEntries}
                  onEdit={handleEditEntry}
                  onDelete={handleDelete}
                  onView={handleViewEntry}
                  onNewEntry={handleNewEntry}
                />
              </>
            )
          })()}
        </>
      )}

      {viewMode === 'editor' && (
        <JournalEditor
          initialTitle={editingEntry?.title}
          initialContent={editingEntry?.content}
          initialTags={editingEntry?.tags}
          initialCategory={editingEntry?.category}
          initialFolderId={editingEntry?.folderId}
          folders={folders}
          currentFolder={selectedFolderId ? folders.find(f => f.id === selectedFolderId) || null : null}
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
      
      {/* 删除确认对话框 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm({ show: false, id: '', name: '', type: 'folder' })}
          />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    确认删除
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    此操作不可撤销
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  确定要删除{deleteConfirm.type === 'folder' ? '文件夹' : '日志'} 
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    &quot;{deleteConfirm.name}&quot;
                  </span> 吗？
                </p>
                {deleteConfirm.type === 'folder' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    文件夹中的日志会移动到根目录
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirm({ show: false, id: '', name: '', type: 'folder' })}
                  className="cursor-pointer hover:cursor-pointer"
                >
                  取消
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 创建文件夹模态框 */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => {
          setShowCreateFolderModal(false)
          setFolderType(null)
        }}
        onSubmit={handleCreateFolder}
        folderType={folderType}
      />
    </div>
  )
}