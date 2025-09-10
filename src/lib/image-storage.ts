/**
 * 图片存储服务 - 使用 IndexedDB 存储大型图片数据
 */

interface ImageData {
  id: string
  data: string
  timestamp: number
}

class ImageStorage {
  private dbName = 'journal_images'
  private storeName = 'images'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof window === 'undefined') return
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async saveImage(id: string, data: string): Promise<void> {
    console.log(`🔄 Saving image to IndexedDB: ${id}, size: ${data.length} bytes`)
    if (!this.db) await this.init()
    if (!this.db) throw new Error('Failed to initialize database')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const imageData: ImageData = {
        id,
        data,
        timestamp: Date.now()
      }
      
      const request = store.put(imageData)
      
      request.onsuccess = () => {
        console.log(`✅ Image saved successfully: ${id}`)
        resolve()
      }
      request.onerror = () => {
        console.error('❌ Failed to save image:', id, request.error)
        reject(request.error)
      }
    })
  }

  async getImage(id: string): Promise<string | null> {
    console.log(`🔍 Getting image from IndexedDB: ${id}`)
    if (!this.db) await this.init()
    if (!this.db) return null
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)
      
      request.onsuccess = () => {
        const result = request.result as ImageData | undefined
        if (result) {
          console.log(`✅ Image found: ${id}, size: ${result.data.length} bytes`)
          resolve(result.data)
        } else {
          console.log(`❌ Image not found: ${id}`)
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.error('❌ Failed to get image:', id, request.error)
        reject(request.error)
      }
    })
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init()
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to delete image:', request.error)
        reject(request.error)
      }
    })
  }

  async getAllImages(): Promise<ImageData[]> {
    if (!this.db) await this.init()
    if (!this.db) return []
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      
      request.onerror = () => {
        console.error('Failed to get all images:', request.error)
        reject(request.error)
      }
    })
  }

  async clearOldImages(daysToKeep: number = 30): Promise<void> {
    if (!this.db) await this.init()
    if (!this.db) return
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          store.delete(cursor.primaryKey)
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => {
        console.error('Failed to clear old images:', request.error)
        reject(request.error)
      }
    })
  }

  async getStorageSize(): Promise<number> {
    if (!this.db) await this.init()
    if (!this.db) return 0
    
    const images = await this.getAllImages()
    return images.reduce((total, img) => total + img.data.length, 0)
  }

  /**
   * 处理HTML内容中的图片，将base64图片提取并存储到IndexedDB
   */
  async processHTMLImages(html: string): Promise<string> {
    if (typeof window === 'undefined') return html
    
    console.log(`📝 Processing HTML images, original length: ${html.length}`)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const images = tempDiv.querySelectorAll('img')
    
    console.log(`🖼️ Found ${images.length} images to process`)
    
    for (const img of Array.from(images)) {
      const src = img.src
      
      // 只处理base64图片
      if (src && src.startsWith('data:')) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        console.log(`🔄 Processing base64 image, generating ID: ${imageId}`)
        
        try {
          // 保存到IndexedDB
          await this.saveImage(imageId, src)
          
          // 替换src为占位符，保留原始尺寸
          img.setAttribute('data-image-id', imageId)
          img.setAttribute('data-original-src', src)
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
          
          console.log(`✅ Image processed successfully: ${imageId}`)
        } catch (error) {
          console.error('❌ Failed to save image to IndexedDB:', error)
        }
      }
    }
    
    const processedHtml = tempDiv.innerHTML
    console.log(`📝 Processed HTML length: ${processedHtml.length}`)
    return processedHtml
  }

  /**
   * 恢复HTML中的图片，从IndexedDB加载图片数据
   */
  async restoreHTMLImages(html: string): Promise<string> {
    if (typeof window === 'undefined') return html
    
    console.log(`📖 Restoring HTML images, original length: ${html.length}`)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const images = tempDiv.querySelectorAll('img[data-image-id]')
    
    console.log(`🖼️ Found ${images.length} images to restore`)
    
    for (const img of Array.from(images)) {
      const imageId = img.getAttribute('data-image-id')
      
      if (imageId) {
        console.log(`🔄 Restoring image: ${imageId}`)
        try {
          const imageData = await this.getImage(imageId)
          if (imageData) {
            img.src = imageData
            console.log(`✅ Image restored successfully: ${imageId}`)
          } else {
            console.log(`⚠️ Image data not found, trying fallback: ${imageId}`)
            // 尝试使用备份数据
            const originalSrc = img.getAttribute('data-original-src')
            if (originalSrc) {
              img.src = originalSrc
              console.log(`✅ Used fallback image: ${imageId}`)
            }
          }
        } catch (error) {
          console.error('❌ Failed to restore image from IndexedDB:', error)
          // 尝试使用备份数据
          const originalSrc = img.getAttribute('data-original-src')
          if (originalSrc) {
            img.src = originalSrc
            console.log(`✅ Used fallback image after error: ${imageId}`)
          }
        }
      }
    }
    
    const restoredHtml = tempDiv.innerHTML
    console.log(`📖 Restored HTML length: ${restoredHtml.length}`)
    return restoredHtml
  }
}

export const imageStorage = new ImageStorage()