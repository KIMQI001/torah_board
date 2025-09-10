"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Image, Bold, Italic, List, Link2, Heading2 } from "lucide-react"
import { processHTMLImages, compressImage } from "@/lib/image-utils"

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<Map<string, string>>(new Map())
  
  // 压缩图片
  const compressImage = (base64String: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = base64String
    })
  }

  // 处理粘贴事件 - 简化版本用于调试
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    console.log('🎯 PASTE EVENT TRIGGERED!') // 基础测试
    
    const items = e.clipboardData?.items
    if (!items) {
      console.log('❌ No clipboardData items')
      return
    }

    console.log(`📋 Clipboard has ${items.length} items`)

    // 打印所有项目信息
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log(`📋 Item ${i}:`, {
        type: item.type,
        kind: item.kind,
        isImage: item.type.indexOf('image') !== -1
      })
    }

    // 查找图片项目
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.indexOf('image') !== -1) {
        console.log('🖼️ Found image item!')
        e.preventDefault() // 阻止默认粘贴
        
        const file = item.getAsFile()
        if (file) {
          console.log(`✅ Got file: ${file.type}, ${(file.size / 1024).toFixed(2)}KB`)
          
          // 简单测试 - 直接创建FileReader读取
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            console.log(`✅ File read complete, dataUrl length: ${dataUrl.length}`)
            
            // 创建简单的图片元素
            const img = document.createElement('img')
            img.src = dataUrl
            img.style.maxWidth = '200px'
            img.style.height = 'auto'
            img.style.border = '2px solid red' // 明显的边框用于测试
            
            // 直接插入到编辑器
            if (editorRef.current) {
              editorRef.current.appendChild(img)
              console.log('✅ Image inserted!')
              
              // 触发内容更新
              setTimeout(() => {
                handleContentChange()
              }, 100)
            }
          }
          
          reader.onerror = (error) => {
            console.error('❌ FileReader error:', error)
          }
          
          reader.readAsDataURL(file)
        } else {
          console.log('❌ Could not get file from clipboard item')
        }
        break
      }
    }
  }

  // 异步处理图片文件
  const processImageFile = async (file: File) => {
    try {
      console.log(`🔄 Compressing image...`)
      
      // 压缩图片 - 使用更高质量设置
      const compressedImage = await compressImage(file, {
        maxWidth: 1600, // 增加最大尺寸
        maxHeight: 1600,
        quality: 0.9    // 提高质量
      })
      
      console.log(`✅ Compressed image size: ${((compressedImage.length * 3) / (4 * 1024)).toFixed(2)}KB`)
      
      // 创建图片元素
      const img = document.createElement('img')
      img.src = compressedImage
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.borderRadius = '8px'
      img.style.margin = '10px 0'
      img.dataset.imageId = `img_${Date.now()}`
      
      // 插入到编辑器
      if (editorRef.current) {
        editorRef.current.appendChild(img)
        console.log(`✅ Image inserted into editor`)
        
        // 触发内容更新
        handleContentChange()
      }
    } catch (error) {
      console.error('❌ Failed to process pasted image:', error)
    }
  }

  // 处理图片上传
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(async (file) => {
          try {
            console.log(`🖼️ Uploading image: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB`)
            
            // 压缩图片 - 使用更高质量设置
            const compressedImage = await compressImage(file, {
              maxWidth: 1600, // 增加最大尺寸
              maxHeight: 1600,
              quality: 0.9    // 提高质量
            })
            
            console.log(`✅ Compressed image size: ${((compressedImage.length * 3) / (4 * 1024)).toFixed(2)}KB`)
            
            // 创建图片元素
            const img = document.createElement('img')
            img.src = compressedImage
            img.style.maxWidth = '100%'
            img.style.height = 'auto'
            img.style.borderRadius = '8px'
            img.style.margin = '10px 0'
            img.dataset.imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            // 插入图片到编辑器末尾
            editorRef.current?.appendChild(img)
            
            // 触发内容更新
            await handleContentChange()
          } catch (error) {
            console.error('❌ Failed to upload image:', error)
          }
        })
      }
    }
    input.click()
  }

  // 将HTML内容转换为Markdown
  const htmlToMarkdown = (html: string): string => {
    if (!html || html === '<br>') return ''
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    let markdown = ''
    
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        markdown += text
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        
        switch (element.tagName.toLowerCase()) {
          case 'img':
            const src = element.getAttribute('src') || ''
            const imageId = element.dataset.imageId || element.getAttribute('alt') || 'image'
            markdown += `\n![${imageId}](${src})\n`
            break
          case 'b':
          case 'strong':
            markdown += '**'
            Array.from(element.childNodes).forEach(processNode)
            markdown += '**'
            break
          case 'i':
          case 'em':
            markdown += '*'
            Array.from(element.childNodes).forEach(processNode)
            markdown += '*'
            break
          case 'h1':
            markdown += '\n# '
            Array.from(element.childNodes).forEach(processNode)
            markdown += '\n\n'
            break
          case 'h2':
            markdown += '\n## '
            Array.from(element.childNodes).forEach(processNode)
            markdown += '\n\n'
            break
          case 'h3':
            markdown += '\n### '
            Array.from(element.childNodes).forEach(processNode)
            markdown += '\n\n'
            break
          case 'ul':
            markdown += '\n'
            Array.from(element.children).forEach(child => {
              if (child.tagName.toLowerCase() === 'li') {
                markdown += '- '
                Array.from(child.childNodes).forEach(processNode)
                markdown += '\n'
              }
            })
            markdown += '\n'
            break
          case 'ol':
            markdown += '\n'
            let index = 1
            Array.from(element.children).forEach(child => {
              if (child.tagName.toLowerCase() === 'li') {
                markdown += `${index}. `
                Array.from(child.childNodes).forEach(processNode)
                markdown += '\n'
                index++
              }
            })
            markdown += '\n'
            break
          case 'br':
            markdown += '\n'
            break
          case 'p':
            if (element.innerHTML !== '<br>') {
              Array.from(element.childNodes).forEach(processNode)
              markdown += '\n\n'
            }
            break
          case 'div':
            Array.from(element.childNodes).forEach(processNode)
            break
          default:
            Array.from(element.childNodes).forEach(processNode)
        }
      }
    }
    
    Array.from(tempDiv.childNodes).forEach(processNode)
    
    // 清理多余的换行和空白
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+|\n+$/g, '')
      .trim()
  }

  // 将Markdown转换为HTML（用于初始化）
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return ''
    
    let html = markdown
    
    // 处理图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" data-image-id="${alt}" />`
    })
    
    // 处理标题（必须在其他处理之前）
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    
    // 处理加粗
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    
    // 处理斜体
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    
    // 处理无序列表
    const lines = html.split('\n')
    let inList = false
    const processedLines: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isListItem = line.match(/^- (.+)$/)
      
      if (isListItem) {
        if (!inList) {
          processedLines.push('<ul>')
          inList = true
        }
        processedLines.push(`<li>${isListItem[1]}</li>`)
      } else {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        processedLines.push(line)
      }
    }
    
    if (inList) {
      processedLines.push('</ul>')
    }
    
    html = processedLines.join('\n')
    
    // 处理段落
    const paragraphs = html.split(/\n\s*\n/)
    html = paragraphs.map(p => {
      p = p.trim()
      if (!p) return ''
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<img')) {
        return p
      }
      return p.includes('\n') ? p.replace(/\n/g, '<br>') : p
    }).filter(p => p).join('\n\n')
    
    return html
  }

  // 从HTML中提取纯文本（用于摘要）
  const htmlToPlainText = (html: string): string => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // 移除图片标签，替换为[图片]
    tempDiv.querySelectorAll('img').forEach(img => {
      img.replaceWith('[图片]')
    })
    
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  // 处理内容变化
  const handleContentChange = async () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML
      console.log('📝 Content changed, original HTML:', html.substring(0, 100) + '...')
      
      // 确保换行符正确转换为 <br> 标签
      html = normalizeHTML(html)
      console.log('📝 Normalized HTML:', html.substring(0, 100) + '...')
      
      try {
        // 处理和压缩图片
        const processedHtml = await processHTMLImages(html)
        console.log('✅ Final processed HTML length:', processedHtml.length)
        onChange(processedHtml)
      } catch (error) {
        console.error('❌ Failed to process images:', error)
        // 如果处理失败，使用标准化的HTML
        onChange(html)
      }
    }
  }

  // 标准化HTML内容，确保换行符正确处理
  const normalizeHTML = (html: string): string => {
    // 创建临时元素来处理HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // 处理所有文本节点，将换行符转换为<br>
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        if (text.includes('\n')) {
          const lines = text.split('\n')
          const parent = node.parentNode
          if (parent) {
            // 移除原文本节点
            parent.removeChild(node)
            
            // 插入新的文本节点和<br>标签
            lines.forEach((line, index) => {
              if (index > 0) {
                parent.appendChild(document.createElement('br'))
              }
              if (line.trim()) {
                parent.appendChild(document.createTextNode(line))
              }
            })
          }
        }
      } else {
        // 递归处理子节点
        Array.from(node.childNodes).forEach(walkTextNodes)
      }
    }
    
    walkTextNodes(tempDiv)
    return tempDiv.innerHTML
  }

  // 执行格式化命令
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    // 异步调用，不阻塞UI
    handleContentChange()
  }

  // 初始化编辑器内容
  useEffect(() => {
    if (editorRef.current && value) {
      console.log('📖 Loading editor content, length:', value.length)
      // 直接设置HTML内容，不进行IndexedDB恢复（暂时简化）
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  // 额外的粘贴监听器 - 用于调试
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      console.log('🌍 Global paste event detected')
      
      // 检查是否在编辑器内
      if (editorRef.current && editorRef.current.contains(document.activeElement)) {
        console.log('📝 Paste in editor area')
      }
    }

    // 监听全局粘贴事件
    document.addEventListener('paste', handleGlobalPaste)
    
    return () => {
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [])

  return (
    <div className="border border-input rounded-md">
      <div className="flex items-center gap-1 p-2 border-b">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('formatBlock', 'h2')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleImageUpload}
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[300px] p-4 focus:outline-none"
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          console.log('📝 Key pressed:', e.key)
          // 确保 Enter 键创建正确的换行
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            
            // 插入<br>标签和换行符
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const br = document.createElement('br')
              range.deleteContents()
              range.insertNode(br)
              range.setStartAfter(br)
              range.collapse(true)
              selection.removeAllRanges()
              selection.addRange(range)
            }
            
            // 延迟触发内容更新
            setTimeout(() => handleContentChange(), 10)
          }
        }}
        onFocus={() => console.log('📝 Editor focused')}
        onBlur={() => console.log('📝 Editor blurred')}
        onClick={() => console.log('📝 Editor clicked')}
        placeholder={placeholder}
        style={{ minHeight: '300px' }}
        tabIndex={0}
      />
    </div>
  )
}