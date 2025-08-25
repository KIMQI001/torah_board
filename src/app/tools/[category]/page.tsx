"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Star,
  Search,
  Settings,
  Filter,
  Play,
  Pause,
  Download,
  Upload,
  MoreVertical,
  ExternalLink
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useToolsStore, type ToolCategory } from "@/components/tools/tools-store"
import { useState, useMemo, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"

// 导入具体的工具组件
import { FundingTools } from "@/components/tools/funding-tools"
import { EfficiencyTools } from "@/components/tools/efficiency-tools"
import { SolanaTools } from "@/components/tools/solana-tools"
import { MarketDataTools } from "@/components/tools/market-data-tools"
import { SecurityTools } from "@/components/tools/security-tools"
import { DeveloperTools } from "@/components/tools/developer-tools"

const categoryComponents = {
  funding: FundingTools,
  efficiency: EfficiencyTools,
  solana: SolanaTools,
  market: MarketDataTools,
  security: SecurityTools,
  developer: DeveloperTools
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ category: string } | null>(null)
  
  // 处理异步 params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])
  
  if (!resolvedParams) {
    return <div>Loading...</div>
  }
  const { t, language } = useLanguage()
  const router = useRouter()
  const { 
    tools, 
    categories, 
    favoriteTools,
    incrementToolUsage,
    addToFavorites,
    removeFromFavorites
  } = useToolsStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // 验证分类是否存在
  const category = categories.find(c => c.id === resolvedParams.category)
  if (!category) {
    notFound()
  }
  
  // 获取该分类的工具
  const categoryTools = tools.filter(tool => tool.category === resolvedParams.category as ToolCategory)
  
  // 筛选工具
  const filteredTools = useMemo(() => {
    let filtered = categoryTools
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(tool => tool.status === selectedStatus)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.nameZh.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.descriptionZh.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [categoryTools, selectedStatus, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500 bg-green-500/10"
      case "beta":
        return "text-blue-500 bg-blue-500/10"
      case "coming-soon":
        return "text-yellow-500 bg-yellow-500/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const handleToolClick = (toolId: string) => {
    incrementToolUsage(toolId)
  }

  const handleFavoriteToggle = (toolId: string) => {
    if (favoriteTools.includes(toolId)) {
      removeFromFavorites(toolId)
    } else {
      addToFavorites(toolId)
    }
  }

  // 统计数据
  const stats = {
    total: categoryTools.length,
    active: categoryTools.filter(t => t.status === 'active').length,
    beta: categoryTools.filter(t => t.status === 'beta').length,
    comingSoon: categoryTools.filter(t => t.status === 'coming-soon').length,
    favorites: categoryTools.filter(t => favoriteTools.includes(t.id)).length
  }

  // 获取对应的组件
  const CategoryComponent = categoryComponents[resolvedParams.category as keyof typeof categoryComponents]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'zh' ? category.nameZh : category.name}
            </h1>
            <p className="text-muted-foreground">
              {language === 'zh' ? category.descriptionZh : category.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {stats.total} {language === 'zh' ? '个工具' : 'tools'}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {language === 'zh' ? '设置' : 'Settings'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh' ? '可用工具' : 'Active Tools'}
                </p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh' ? '测试版' : 'Beta Tools'}
                </p>
                <p className="text-2xl font-bold">{stats.beta}</p>
              </div>
              <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Pause className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh' ? '即将推出' : 'Coming Soon'}
                </p>
                <p className="text-2xl font-bold">{stats.comingSoon}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh' ? '我的收藏' : 'Favorites'}
                </p>
                <p className="text-2xl font-bold">{stats.favorites}</p>
              </div>
              <div className="h-8 w-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={language === 'zh' ? '搜索工具...' : 'Search tools...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={selectedStatus === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            <Filter className="h-4 w-4 mr-2" />
            {language === 'zh' ? '全部' : 'All'}
          </Button>
          <Button 
            variant={selectedStatus === 'active' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus('active')}
          >
            {language === 'zh' ? '可用' : 'Active'}
          </Button>
          <Button 
            variant={selectedStatus === 'beta' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus('beta')}
          >
            {language === 'zh' ? '测试版' : 'Beta'}
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">
            {language === 'zh' ? '工具列表' : 'Tool List'}
          </TabsTrigger>
          <TabsTrigger value="interactive">
            {language === 'zh' ? '交互式工具' : 'Interactive Tools'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-6">
          {filteredTools.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => {
                const isFavorite = favoriteTools.includes(tool.id)
                return (
                  <Card key={tool.id} className="group hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {language === 'zh' ? tool.nameZh : tool.name}
                            </h3>
                            {tool.featured && (
                              <Badge variant="secondary" className="text-xs">
                                {language === 'zh' ? '推荐' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {language === 'zh' ? tool.descriptionZh : tool.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleFavoriteToggle(tool.id)}
                          >
                            <Star className={`h-3 w-3 ${isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Badge className={`text-xs ${getStatusColor(tool.status)}`}>
                            {tool.status === 'active' 
                              ? (language === 'zh' ? '可用' : 'Active')
                              : tool.status === 'beta' 
                              ? (language === 'zh' ? '测试' : 'Beta')
                              : (language === 'zh' ? '即将' : 'Soon')
                            }
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {tool.useCount > 0 && (
                            <span>{language === 'zh' ? '使用' : 'Used'} {tool.useCount}x</span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant={tool.status === 'active' ? 'default' : 'outline'}
                          disabled={tool.status === 'coming-soon'}
                          onClick={() => handleToolClick(tool.id)}
                        >
                          {tool.status === 'coming-soon' 
                            ? (language === 'zh' ? '即将推出' : 'Coming Soon')
                            : (language === 'zh' ? '使用工具' : 'Use Tool')
                          }
                          {tool.status !== 'coming-soon' && (
                            <ExternalLink className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '未找到工具' : 'No tools found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'zh' 
                    ? '尝试调整您的搜索或筛选条件' 
                    : 'Try adjusting your search or filter criteria'}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setSelectedStatus('all')
                }}>
                  {language === 'zh' ? '清除筛选' : 'Clear filters'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          {CategoryComponent ? (
            <CategoryComponent />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '交互式工具开发中' : 'Interactive Tools Coming Soon'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'zh' 
                    ? '我们正在为这个分类开发交互式工具' 
                    : 'We are developing interactive tools for this category'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}