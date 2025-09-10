"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2, Search, Filter, SortDesc, SortAsc, Calendar, Tag, Plus } from "lucide-react"
import { ImageViewer } from "./image-viewer"

export interface JournalEntry {
  id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  folderId?: string
  createdAt: string
  updatedAt: string
}

interface JournalListProps {
  entries: JournalEntry[]
  onEdit: (entry: JournalEntry) => void
  onDelete: (id: string) => void
  onView: (entry: JournalEntry) => void
  onNewEntry?: () => void
}

export function JournalList({ entries, onEdit, onDelete, onView, onNewEntry }: JournalListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'title'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewingImage, setViewingImage] = useState<{ src: string; alt?: string } | null>(null)
  const [restoredEntries, setRestoredEntries] = useState<JournalEntry[]>([])

  // 直接使用条目，不进行IndexedDB恢复
  useEffect(() => {
    console.log('📖 JournalList: Setting entries, count:', entries.length)
    setRestoredEntries(entries)
  }, [entries])

  const categories = [...new Set(entries.map(entry => entry.category))].filter(Boolean)
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))]

  // 从HTML内容提取图片
  const extractImages = (htmlContent: string): string[] => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const images = tempDiv.querySelectorAll('img')
    return Array.from(images).map(img => img.src).filter(src => src && src.length > 0)
  }

  // 创建带换行的文本摘要
  const createTextExcerpt = (htmlContent: string): string => {
    if (!htmlContent) return ''
    
    // 创建临时元素处理HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // 移除所有图片元素
    tempDiv.querySelectorAll('img').forEach(img => img.remove())
    
    // 将<br>标签转换为换行符，保持换行格式
    tempDiv.querySelectorAll('br').forEach(br => {
      br.replaceWith('\n')
    })
    
    // 将<p>标签转换为段落换行
    tempDiv.querySelectorAll('p').forEach(p => {
      const text = p.textContent || ''
      if (text.trim()) {
        p.replaceWith(text + '\n\n')
      } else {
        p.remove()
      }
    })
    
    // 获取处理后的文本，保留换行符
    let textContent = (tempDiv.textContent || tempDiv.innerText || '').trim()
    
    // 清理多余的空行
    textContent = textContent.replace(/\n{3,}/g, '\n\n')
    
    // 截取前150个字符
    if (textContent.length > 150) {
      // 尽量在单词边界截取
      let excerpt = textContent.substring(0, 150)
      const lastSpace = excerpt.lastIndexOf(' ')
      if (lastSpace > 100) {
        excerpt = excerpt.substring(0, lastSpace)
      }
      return excerpt + '...'
    }
    
    return textContent
  }

  const filteredAndSortedEntries = restoredEntries
    .filter(entry => {
      // 提取HTML内容中的纯文本用于搜索
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = entry.content || ''
      const searchableContent = tempDiv.textContent || tempDiv.innerText || ''
      
      const matchesSearch = !searchQuery || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchableContent.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = !selectedCategory || entry.category === selectedCategory
      const matchesTag = !selectedTag || entry.tags.includes(selectedTag)

      return matchesSearch && matchesCategory && matchesTag
    })
    .sort((a, b) => {
      let aValue: string | Date, bValue: string | Date
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'updated':
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        case 'created':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  // 保留原来的 filteredEntries 以兼容性
  const filteredEntries = filteredAndSortedEntries.filter(entry => {
    // 提取HTML内容中的纯文本用于搜索
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = entry.content || ''
    const searchableContent = tempDiv.textContent || tempDiv.innerText || ''
    
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchableContent.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || entry.category === selectedCategory
    const matchesTag = !selectedTag || entry.tags.includes(selectedTag)

    return true // 已经在上面的 filter 中处理了筛选逻辑
  })

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Search className="h-5 w-5 mr-2" />
            搜索与筛选
          </CardTitle>
          <CardDescription>
            在 {entries.length} 篇日志中快速找到你需要的内容
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索标题或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="">所有分类</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="">所有标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder)
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="created-desc">最新创建</option>
                <option value="created-asc">最早创建</option>
                <option value="updated-desc">最近更新</option>
                <option value="updated-asc">最早更新</option>
                <option value="title-asc">标题 A-Z</option>
                <option value="title-desc">标题 Z-A</option>
              </select>
            </div>

            {(searchQuery || selectedCategory || selectedTag) && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("")
                    setSelectedTag("")
                  }}
                  className="cursor-pointer hover:cursor-pointer w-full"
                >
                  清除筛选
                </Button>
              </div>
            )}
          </div>

          {filteredAndSortedEntries.length > 0 && (
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {sortBy === 'created' ? <Calendar className="h-3 w-3" /> : 
                 sortBy === 'updated' ? <Calendar className="h-3 w-3" /> : 
                 <Tag className="h-3 w-3" />}
                <span>
                  {sortBy === 'created' ? '按创建时间' : 
                   sortBy === 'updated' ? '按更新时间' : 
                   '按标题'} 
                  {sortOrder === 'desc' ? '降序' : '升序'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">日志列表</h3>
          <p className="text-sm text-muted-foreground">
            显示 {filteredAndSortedEntries.length} / {restoredEntries.length} 篇日志
          </p>
        </div>
        {onNewEntry && (
          <Button onClick={onNewEntry} className="cursor-pointer hover:cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            新建日志
          </Button>
        )}
      </div>

      {/* Entries List */}
      <div className="space-y-4 animate-in fade-in-50 duration-500">
        {filteredAndSortedEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-muted-foreground">
                {entries.length === 0 ? (
                  <div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                      <Search className="h-10 w-10 opacity-50" />
                    </div>
                    <p className="text-xl font-medium mb-2">还没有日志</p>
                    <p className="text-base mb-6">开始记录你的交易历程吧！</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                      <Filter className="h-10 w-10 opacity-50" />
                    </div>
                    <p className="text-xl font-medium mb-2">没有找到匹配的日志</p>
                    <p className="text-base">试试调整搜索条件</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedEntries.map((entry) => {
            const images = extractImages(entry.content || '')
            return (
              <Card key={entry.id} className="group hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 border-l-4 hover:border-l-primary" style={{ borderLeftColor: 'transparent' }} onClick={() => onView(entry)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-3 group-hover:text-primary transition-colors">{entry.title}</CardTitle>
                      
                      {/* 显示缩略图 */}
                      {images.length > 0 && (
                        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                          {images.slice(0, 3).map((src, index) => (
                            <div
                              key={index}
                              className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer hover:shadow-md"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingImage({ src, alt: `Image ${index + 1}` })
                              }}
                            >
                              <img
                                src={src}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          ))}
                          {images.length > 3 && (
                            <div className="flex-shrink-0 w-24 h-24 rounded-lg border border-border flex items-center justify-center bg-muted hover:bg-accent transition-colors">
                              <span className="text-sm font-medium text-muted-foreground">+{images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line leading-relaxed">
                        {createTextExcerpt(entry.content || entry.excerpt || '')}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(entry)
                        }}
                        className="cursor-pointer hover:cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
                        title="编辑"
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
                        className="cursor-pointer hover:cursor-pointer hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      {entry.category}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.updatedAt).toLocaleDateString('zh-CN')} 更新
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      
      {/* 图片查看器 */}
      {viewingImage && (
        <ImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          isOpen={!!viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}