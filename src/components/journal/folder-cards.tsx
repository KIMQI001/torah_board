"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { 
  FolderPlus, 
  Folder,
  Edit3, 
  Trash2, 
  MoreVertical
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

interface FolderCardsProps {
  folders: JournalFolder[]
  onCreateFolder: (folder: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>, folderType?: 'project' | 'investment') => void
  onUpdateFolder: (id: string, folder: Partial<JournalFolder>) => void
  onDeleteFolder: (id: string) => void
  onSelectFolder: (folderId: string) => void
  showCreateModal?: boolean
  onCreateModalChange?: (show: boolean) => void
  folderType?: 'project' | 'investment' | null
}

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (folder: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>, folderType?: 'project' | 'investment') => void
  editingFolder?: JournalFolder | null
  folderType?: 'project' | 'investment' | null
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
  "", "💎", "🌟", "🎨", "🔮", "🎭", "🎪", "🌈",
  "🦄", "🌸", "🍃", "🌺", "🌙", "☀️", "❄️", "🔥",
  "💫", "✨", "🌊", "🍀", "🌷", "🌻", "🎀", "💝",
  "🎵", "🎶", "🎸", "🎹", "🎯", "🎲", "🎊", "🎈"
]

export function CreateFolderModal({ isOpen, onClose, onSubmit, editingFolder, folderType }: CreateFolderModalProps) {
  const [name, setName] = useState(editingFolder?.name || "")
  const [description, setDescription] = useState(editingFolder?.description || "")
  const [color, setColor] = useState(editingFolder?.color || "#3B82F6")
  const [icon, setIcon] = useState(editingFolder?.icon || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      sortOrder: 0
    }, folderType || undefined)

    // 重置表单
    setName("")
    setDescription("")
    setColor("#3B82F6")
    setIcon("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {icon || <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingFolder ? "编辑文件夹" : `新建${folderType === 'project' ? '项目' : folderType === 'investment' ? '投资' : ''}文件夹`}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editingFolder 
                  ? "修改文件夹信息" 
                  : `创建${folderType === 'project' ? '项目' : folderType === 'investment' ? '投资' : ''}文件夹来组织你的日志条目`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer hover:cursor-pointer"
          >
            <svg className="h-5 w-5 text-gray-500 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 第一行：文件夹名称 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                文件夹名称 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入文件夹名称..."
                className="h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                required
              />
            </div>

            {/* 第二行：描述 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                描述 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述这个文件夹的用途..."
                rows={3}
                className="resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            {/* 第三行：图标和颜色选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选择图标</label>
                <div className="grid grid-cols-8 gap-2">
                  {FOLDER_ICONS.map((iconOption, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setIcon(iconOption)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all text-sm hover:scale-105 cursor-pointer hover:cursor-pointer ${
                        icon === iconOption 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-105' 
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300'
                      }`}
                    >
                      {iconOption === "" ? (
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                      ) : (
                        iconOption
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选择颜色</label>
                <div className="grid grid-cols-4 gap-3">
                  {FOLDER_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setColor(colorOption.value)}
                      className={`w-12 h-12 rounded-xl transition-all hover:scale-110 flex items-center justify-center cursor-pointer hover:cursor-pointer ${colorOption.bg} ${
                        color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:ring-2 hover:ring-offset-1 hover:ring-gray-300'
                      }`}
                      title={colorOption.name}
                    >
                      {color === colorOption.value && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="min-w-[80px] border-gray-300 dark:border-gray-600 cursor-pointer hover:cursor-pointer"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                className="min-w-[80px] bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:cursor-pointer"
              >
                {editingFolder ? "保存" : "创建"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function FolderCard({ folder, onSelect, onEdit, onDelete }: {
  folder: JournalFolder
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card 
      className="group relative cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      style={{ borderColor: folder.color }}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="text-3xl"
            style={{ color: folder.color }}
          >
            {folder.icon || <div className="w-6 h-6 rounded-full" style={{ backgroundColor: folder.color }}></div>}
          </div>
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-10">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left cursor-pointer hover:cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                    setShowMenu(false)
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                  编辑
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left text-red-600 cursor-pointer hover:cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{folder.name}</CardTitle>
        {folder.description && (
          <CardDescription className="text-sm mt-1">{folder.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{folder.entryCount || 0} 条日志</span>
          <span>最后更新 {new Date(folder.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function FolderCards({ 
  folders, 
  onCreateFolder, 
  onUpdateFolder, 
  onDeleteFolder, 
  onSelectFolder,
  showCreateModal: externalShowCreateModal = false,
  onCreateModalChange,
  folderType
}: FolderCardsProps) {
  const [internalShowCreateModal, setInternalShowCreateModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<JournalFolder | null>(null)
  
  // 使用外部控制的模态框状态，或者内部状态
  const showCreateModal = onCreateModalChange ? externalShowCreateModal : internalShowCreateModal
  const setShowCreateModal = onCreateModalChange || setInternalShowCreateModal

  const handleEdit = (folder: JournalFolder) => {
    setEditingFolder(folder)
    setShowCreateModal(true)
  }

  const handleSubmit = (folderData: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt'>, folderType?: 'project' | 'investment') => {
    if (editingFolder) {
      onUpdateFolder(editingFolder.id, folderData)
      setEditingFolder(null)
    } else {
      onCreateFolder(folderData, folderType)
    }
  }

  const handleDelete = (folderId: string) => {
    if (confirm('确定要删除这个文件夹吗？文件夹中的日志会移动到根目录。')) {
      onDeleteFolder(folderId)
    }
  }

  // 只显示根级文件夹
  const rootFolders = folders.filter(folder => !folder.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="w-full flex-1">
      <Card className="h-full">
        <CardContent className="p-6 h-full">
          {rootFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
              <Folder className="h-20 w-20 mb-6 opacity-50" />
              <p className="text-2xl font-medium mb-2">还没有文件夹</p>
              <p className="text-lg mb-6">创建第一个文件夹来开始整理你的日志</p>
              <Button onClick={() => setShowCreateModal(true)} size="lg" className="cursor-pointer hover:cursor-pointer">
                <FolderPlus className="h-5 w-5 mr-2" />
                新建文件夹
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {rootFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onSelect={() => onSelectFolder(folder.id)}
                  onEdit={() => handleEdit(folder)}
                  onDelete={() => handleDelete(folder.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingFolder(null)
        }}
        onSubmit={handleSubmit}
        editingFolder={editingFolder}
        folderType={folderType}
      />
    </div>
  )
}