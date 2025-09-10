"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { 
  FolderPlus, 
  Folder, 
  FolderOpen, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from "lucide-react"

export interface JournalFolder {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  parentId?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  children?: JournalFolder[]
  entryCount?: number
}

interface FolderManagerProps {
  folders: JournalFolder[]
  onCreateFolder: (folder: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateFolder: (id: string, folder: Partial<JournalFolder>) => void
  onDeleteFolder: (id: string) => void
  onSelectFolder: (folderId: string | null) => void
  selectedFolderId: string | null
}

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (folder: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>) => void
  folders: JournalFolder[]
  editingFolder?: JournalFolder | null
}

const FOLDER_COLORS = [
  { name: "蓝色", value: "#3B82F6", bg: "bg-blue-500" },
  { name: "绿色", value: "#10B981", bg: "bg-green-500" },
  { name: "紫色", value: "#8B5CF6", bg: "bg-purple-500" },
  { name: "红色", value: "#EF4444", bg: "bg-red-500" },
  { name: "橙色", value: "#F59E0B", bg: "bg-orange-500" },
  { name: "粉色", value: "#EC4899", bg: "bg-pink-500" },
  { name: "青色", value: "#06B6D4", bg: "bg-cyan-500" },
  { name: "灰色", value: "#6B7280", bg: "bg-gray-500" }
]

const FOLDER_ICONS = [
  "📁", "📂", "📊", "📈", "💼", "🎯", "⭐", "🔥", 
  "💡", "🚀", "📝", "💰", "🏆", "📋", "🎨", "⚡"
]

function CreateFolderModal({ isOpen, onClose, onSubmit, folders, editingFolder }: CreateFolderModalProps) {
  const [name, setName] = useState(editingFolder?.name || "")
  const [description, setDescription] = useState(editingFolder?.description || "")
  const [color, setColor] = useState(editingFolder?.color || "#3B82F6")
  const [icon, setIcon] = useState(editingFolder?.icon || "📁")
  const [parentId, setParentId] = useState(editingFolder?.parentId || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      parentId: parentId || undefined,
      sortOrder: 0
    })

    // 重置表单
    setName("")
    setDescription("")
    setColor("#3B82F6")
    setIcon("📁")
    setParentId("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {editingFolder ? "编辑文件夹" : "新建文件夹"}
          </CardTitle>
          <CardDescription>
            创建文件夹来组织你的日志条目
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">文件夹名称</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入文件夹名称..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">描述 (可选)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="文件夹描述..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">父文件夹 (可选)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">根目录</option>
                {folders
                  .filter(f => f.id !== editingFolder?.id) // 避免循环引用
                  .map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">颜色</label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={`w-8 h-8 rounded-full ${colorOption.bg} ${
                      color === colorOption.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">图标</label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_ICONS.map((iconOption) => (
                  <button
                    key={iconOption}
                    type="button"
                    onClick={() => setIcon(iconOption)}
                    className={`w-8 h-8 flex items-center justify-center rounded border ${
                      icon === iconOption ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {iconOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit">
                {editingFolder ? "保存" : "创建"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function FolderItem({ 
  folder, 
  level = 0, 
  selectedFolderId,
  onSelect, 
  onEdit, 
  onDelete,
  expandedFolders,
  onToggleExpand 
}: {
  folder: JournalFolder
  level?: number
  selectedFolderId: string | null
  onSelect: (folderId: string) => void
  onEdit: (folder: JournalFolder) => void
  onDelete: (folderId: string) => void
  expandedFolders: Set<string>
  onToggleExpand: (folderId: string) => void
}) {
  const hasChildren = folder.children && folder.children.length > 0
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id

  return (
    <div>
      <div 
        className={`flex items-center group hover:bg-accent/50 rounded-md p-2 cursor-pointer ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(folder.id)
            }}
            className="mr-1 hover:bg-accent rounded p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        
        <div
          className="flex-1 flex items-center gap-2"
          onClick={() => onSelect(folder.id)}
        >
          <span 
            className="text-lg"
            style={{ color: folder.color }}
          >
            {folder.icon}
          </span>
          <span className="font-medium">{folder.name}</span>
          {folder.entryCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              ({folder.entryCount})
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(folder)
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(folder.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderManager({ 
  folders, 
  onCreateFolder, 
  onUpdateFolder, 
  onDeleteFolder, 
  onSelectFolder,
  selectedFolderId 
}: FolderManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<JournalFolder | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleEdit = (folder: JournalFolder) => {
    setEditingFolder(folder)
    setShowCreateModal(true)
  }

  const handleSubmit = (folderData: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingFolder) {
      onUpdateFolder(editingFolder.id, folderData)
      setEditingFolder(null)
    } else {
      onCreateFolder(folderData)
    }
  }

  const handleDelete = (folderId: string) => {
    if (confirm('确定要删除这个文件夹吗？文件夹中的日志会移动到根目录。')) {
      onDeleteFolder(folderId)
    }
  }

  // 构建文件夹树
  const buildFolderTree = (folders: JournalFolder[]): JournalFolder[] => {
    const folderMap = new Map<string, JournalFolder>()
    const rootFolders: JournalFolder[] = []

    // 创建文件夹映射
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // 构建树形结构
    folders.forEach(folder => {
      const currentFolder = folderMap.get(folder.id)!
      
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!
        parent.children!.push(currentFolder)
      } else {
        rootFolders.push(currentFolder)
      }
    })

    return rootFolders.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const folderTree = buildFolderTree(folders)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">文件夹</CardTitle>
            <CardDescription>组织和管理你的日志</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            新建文件夹
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* 根目录选项 */}
          <div 
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50 ${
              selectedFolderId === null ? 'bg-accent' : ''
            }`}
            onClick={() => onSelectFolder(null)}
          >
            <Folder className="h-4 w-4" />
            <span className="font-medium">所有日志</span>
          </div>

          {/* 文件夹树 */}
          {folderTree.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              onSelect={onSelectFolder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              expandedFolders={expandedFolders}
              onToggleExpand={toggleExpand}
            />
          ))}

          {folderTree.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>还没有文件夹</p>
              <p className="text-sm">创建文件夹来组织你的日志</p>
            </div>
          )}
        </div>
      </CardContent>

      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingFolder(null)
        }}
        onSubmit={handleSubmit}
        folders={folders.filter(f => !f.parentId)} // 只显示根文件夹作为父选项
        editingFolder={editingFolder}
      />
    </Card>
  )
}