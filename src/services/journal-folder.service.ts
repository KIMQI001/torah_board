/**
 * 日志文件夹服务 - 使用localStorage存储
 */

export interface JournalFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
  children?: JournalFolder[];
}

export class JournalFolderService {
  private static readonly STORAGE_KEY = 'journal_folders';

  /**
   * 获取localStorage中的文件夹数据
   */
  private static getLocalFolders(): JournalFolder[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const folders = JSON.parse(cached);
        console.log('📁 Loaded folders from localStorage:', folders.length);
        return folders;
      } else {
        // 创建默认文件夹
        const defaultFolders = this.createDefaultFolders();
        this.setLocalFolders(defaultFolders);
        return defaultFolders;
      }
    } catch (error) {
      console.error('Error reading folder cache:', error);
      return [];
    }
  }

  /**
   * 保存文件夹到localStorage
   */
  private static setLocalFolders(folders: JournalFolder[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(folders));
      console.log('📁 Saved folders to localStorage:', folders.length);
    } catch (error) {
      console.error('Error saving folder cache:', error);
    }
  }

  /**
   * 创建默认文件夹
   */
  private static createDefaultFolders(): JournalFolder[] {
    return [
      {
        id: '1',
        name: '项目研究',
        description: '记录项目研究、技术分析和开发进展',
        color: '#3B82F6',
        icon: '🔬',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entryCount: 0
      },
      {
        id: '2',
        name: '交易策略',
        description: '记录交易策略、市场分析和投资心得',
        color: '#10B981',
        icon: '📈',
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entryCount: 0
      }
    ];
  }

  /**
   * 获取所有文件夹
   */
  static async getFolders(): Promise<JournalFolder[]> {
    try {
      return this.getLocalFolders();
    } catch (error) {
      console.error('Error fetching journal folders:', error);
      return [];
    }
  }

  /**
   * 创建文件夹
   */
  static async createFolder(data: Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt' | 'entryCount'>): Promise<JournalFolder> {
    try {
      const folders = this.getLocalFolders();
      const newFolder: JournalFolder = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entryCount: 0
      };
      
      const updatedFolders = [...folders, newFolder];
      this.setLocalFolders(updatedFolders);
      
      console.log('📁 Created new folder:', newFolder.name);
      return newFolder;
    } catch (error) {
      console.error('Error creating journal folder:', error);
      throw error;
    }
  }

  /**
   * 更新文件夹
   */
  static async updateFolder(id: string, data: Partial<Omit<JournalFolder, 'id' | 'createdAt' | 'updatedAt' | 'entryCount'>>): Promise<JournalFolder> {
    try {
      const folders = this.getLocalFolders();
      const folderIndex = folders.findIndex(f => f.id === id);
      
      if (folderIndex === -1) {
        throw new Error('Folder not found');
      }
      
      const updatedFolder = {
        ...folders[folderIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      const updatedFolders = [...folders];
      updatedFolders[folderIndex] = updatedFolder;
      this.setLocalFolders(updatedFolders);
      
      console.log('📁 Updated folder:', updatedFolder.name);
      return updatedFolder;
    } catch (error) {
      console.error('Error updating journal folder:', error);
      throw error;
    }
  }

  /**
   * 删除文件夹
   */
  static async deleteFolder(id: string): Promise<boolean> {
    try {
      const folders = this.getLocalFolders();
      const updatedFolders = folders.filter(f => f.id !== id);
      this.setLocalFolders(updatedFolders);
      
      console.log('📁 Deleted folder:', id);
      return true;
    } catch (error) {
      console.error('Error deleting journal folder:', error);
      throw error;
    }
  }

  /**
   * 移动文件夹
   */
  static async moveFolder(id: string, parentId?: string, sortOrder?: number): Promise<JournalFolder> {
    try {
      const folders = this.getLocalFolders();
      const folderIndex = folders.findIndex(f => f.id === id);
      
      if (folderIndex === -1) {
        throw new Error('Folder not found');
      }
      
      const updatedFolder = {
        ...folders[folderIndex],
        parentId,
        sortOrder: sortOrder ?? folders[folderIndex].sortOrder,
        updatedAt: new Date().toISOString()
      };
      
      const updatedFolders = [...folders];
      updatedFolders[folderIndex] = updatedFolder;
      this.setLocalFolders(updatedFolders);
      
      console.log('📁 Moved folder:', updatedFolder.name);
      return updatedFolder;
    } catch (error) {
      console.error('Error moving journal folder:', error);
      throw error;
    }
  }

  /**
   * 清空所有文件夹数据
   */
  static clearAllFolders(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('📁 Cleared all folder data');
    } catch (error) {
      console.error('Error clearing folder data:', error);
    }
  }
}