/**
 * 图片处理工具 - 压缩、转换和管理图片
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
}

/**
 * 压缩图片到指定大小
 */
export function compressImage(file: File, options: CompressOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1600,  // 提高默认最大宽度
      maxHeight = 1600, // 提高默认最大高度
      quality = 0.9,    // 提高默认质量
      format = 'jpeg'
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    let objectUrl: string | null = null

    img.onload = () => {
      try {
        // 计算新尺寸
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为 base64
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/webp'
        const compressedDataUrl = canvas.toDataURL(mimeType, quality)
        
        // 清理内存
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        
        resolve(compressedDataUrl)
      } catch (error) {
        // 清理内存
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        reject(error)
      }
    }

    img.onerror = () => {
      // 清理内存
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      reject(new Error('Failed to load image'))
    }

    // 如果是文件对象，创建URL
    if (file instanceof File) {
      objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
    } else {
      reject(new Error('Invalid file input'))
    }
  })
}

/**
 * 从base64获取文件大小（字节）
 */
export function getBase64Size(base64String: string): number {
  // 移除前缀 "data:image/...;base64,"
  const base64Data = base64String.split(',')[1] || base64String
  // base64 每4个字符代表3个字节
  return Math.ceil(base64Data.length * 3 / 4)
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 检查base64图片是否过大
 */
export function isImageTooLarge(base64String: string, maxSizeKB: number = 500): boolean {
  const sizeInBytes = getBase64Size(base64String)
  return sizeInBytes > maxSizeKB * 1024
}

/**
 * 处理HTML内容中的图片，压缩过大的图片
 */
export async function processHTMLImages(html: string): Promise<string> {
  if (typeof window === 'undefined') return html
  
  console.log('🖼️ Processing HTML images...')
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const images = tempDiv.querySelectorAll('img')
  
  let processedCount = 0
  
  for (const img of Array.from(images)) {
    const src = img.src
    
    // 只处理base64图片
    if (src && src.startsWith('data:image/')) {
      const originalSize = getBase64Size(src)
      console.log(`📊 Image ${processedCount + 1}: ${formatFileSize(originalSize)}`)
      
      // 如果图片过大，进行压缩
      if (isImageTooLarge(src, 800)) { // 800KB限制
        try {
          console.log('🔄 Compressing large image...')
          
          // 创建临时图片元素进行压缩
          const tempImg = new Image()
          tempImg.src = src
          
          await new Promise<void>((resolve, reject) => {
            tempImg.onload = () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              let { width, height } = tempImg
              
              // 如果图片很大，缩小尺寸
              if (width > 1200 || height > 1200) {
                const ratio = Math.min(1200 / width, 1200 / height)
                width *= ratio
                height *= ratio
              }
              
              canvas.width = width
              canvas.height = height
              ctx?.drawImage(tempImg, 0, 0, width, height)
              
              // 压缩图片，降低质量直到大小满足要求
              let quality = 0.8
              let compressedSrc = canvas.toDataURL('image/jpeg', quality)
              
              while (isImageTooLarge(compressedSrc, 800) && quality > 0.1) {
                quality -= 0.1
                compressedSrc = canvas.toDataURL('image/jpeg', quality)
              }
              
              img.src = compressedSrc
              const newSize = getBase64Size(compressedSrc)
              console.log(`✅ Compressed to ${formatFileSize(newSize)} (${Math.round(quality * 100)}% quality)`)
              
              resolve()
            }
            tempImg.onerror = () => reject(new Error('Failed to load image for compression'))
          })
          
          processedCount++
        } catch (error) {
          console.error('❌ Failed to compress image:', error)
        }
      }
    }
  }
  
  console.log(`✅ Processed ${processedCount} images`)
  return tempDiv.innerHTML
}

/**
 * 估算HTML内容的存储大小
 */
export function estimateHTMLSize(html: string): number {
  // 获取字符串的字节大小（UTF-8编码）
  return new Blob([html], { type: 'text/html' }).size
}

/**
 * 检查HTML内容是否适合localStorage存储
 */
export function canStoreInLocalStorage(html: string): boolean {
  const size = estimateHTMLSize(html)
  // localStorage通常有5-10MB限制，我们保守估计4MB
  return size < 4 * 1024 * 1024
}