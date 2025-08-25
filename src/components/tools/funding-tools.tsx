"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Filter,
  Star,
  ExternalLink,
  Calendar,
  MapPin,
  Globe,
  Twitter,
  Plus,
  BookOpen
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useToolsStore } from "@/components/tools/tools-store"
import { useState, useMemo } from "react"

export function FundingTools() {
  const { t, language } = useLanguage()
  const { vcData, favoriteVCs, addVCToFavorites, removeVCFromFavorites } = useToolsStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<string>('all')
  const [showFavorites, setShowFavorites] = useState(false)

  // 筛选 VC 数据
  const filteredVCs = useMemo(() => {
    let filtered = vcData
    
    if (showFavorites) {
      filtered = filtered.filter(vc => favoriteVCs.includes(vc.id))
    }
    
    if (selectedFocus !== 'all') {
      filtered = filtered.filter(vc => vc.focus.some(f => f.toLowerCase().includes(selectedFocus.toLowerCase())))
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(vc => 
        vc.name.toLowerCase().includes(query) ||
        vc.nameZh.toLowerCase().includes(query) ||
        vc.description.toLowerCase().includes(query) ||
        vc.descriptionZh.toLowerCase().includes(query) ||
        vc.focus.some(f => f.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [vcData, showFavorites, selectedFocus, searchQuery, favoriteVCs])

  const handleFavoriteToggle = (vcId: string) => {
    if (favoriteVCs.includes(vcId)) {
      removeVCFromFavorites(vcId)
    } else {
      addVCToFavorites(vcId)
    }
  }

  // 所有投资焦点
  const allFocusAreas = Array.from(new Set(vcData.flatMap(vc => vc.focus)))

  // 投资轮次数据模拟
  const fundingRounds = [
    {
      id: '1',
      projectName: 'Jupiter Exchange',
      projectNameZh: 'Jupiter 交易所',
      round: 'Series A',
      amount: '$40M',
      date: '2024-03-15',
      valuation: '$1.2B',
      lead: 'Multicoin Capital',
      status: 'active' as const,
      category: 'DeFi'
    },
    {
      id: '2',
      projectName: 'Helium Mobile',
      projectNameZh: 'Helium Mobile',
      round: 'Series B',
      amount: '$30M',
      date: '2024-02-20',
      valuation: '$800M',
      lead: 'Jump Crypto',
      status: 'active' as const,
      category: 'DePIN'
    },
    {
      id: '3',
      projectName: 'Tensor',
      projectNameZh: 'Tensor',
      round: 'Seed',
      amount: '$3M',
      date: '2024-01-10',
      valuation: '$25M',
      lead: 'Solana Ventures',
      status: 'active' as const,
      category: 'NFT'
    }
  ]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="vc-database" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vc-database">
            <Building2 className="h-4 w-4 mr-2" />
            {language === 'zh' ? 'VC 数据库' : 'VC Database'}
          </TabsTrigger>
          <TabsTrigger value="funding-tracker">
            <TrendingUp className="h-4 w-4 mr-2" />
            {language === 'zh' ? '融资追踪' : 'Funding Tracker'}
          </TabsTrigger>
          <TabsTrigger value="investor-analyzer">
            <Users className="h-4 w-4 mr-2" />
            {language === 'zh' ? '投资者分析' : 'Investor Analysis'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vc-database" className="space-y-4">
          {/* VC 数据库搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={language === 'zh' ? '搜索 VC 公司...' : 'Search VCs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={showFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
              >
                <Star className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                {language === 'zh' ? '收藏' : 'Favorites'}
              </Button>
              <select 
                value={selectedFocus} 
                onChange={(e) => setSelectedFocus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">{language === 'zh' ? '所有领域' : 'All Focus'}</option>
                {allFocusAreas.map((focus) => (
                  <option key={focus} value={focus}>{focus}</option>
                ))}
              </select>
            </div>
          </div>

          {/* VC 列表 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVCs.map((vc) => {
              const isFavorite = favoriteVCs.includes(vc.id)
              return (
                <Card key={vc.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {language === 'zh' ? vc.nameZh : vc.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === 'zh' ? vc.descriptionZh : vc.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleFavoriteToggle(vc.id)}
                      >
                        <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{vc.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span>{language === 'zh' ? '管理资产' : 'AUM'}: {vc.aum}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span>{vc.portfolioCount} {language === 'zh' ? '个投资项目' : 'portfolio companies'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vc.focus.slice(0, 3).map((focus) => (
                        <Badge key={focus} variant="secondary" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                      {vc.focus.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vc.focus.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Globe className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Twitter className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="sm" variant="outline">
                        {language === 'zh' ? '查看详情' : 'View Details'}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredVCs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '未找到相关 VC' : 'No VCs found'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'zh' ? '尝试调整搜索条件' : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="funding-tracker" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh' ? '本月融资' : 'This Month'}
                    </p>
                    <p className="text-2xl font-bold">$127M</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh' ? '融资轮次' : 'Funding Rounds'}
                    </p>
                    <p className="text-2xl font-bold">{fundingRounds.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh' ? '平均估值' : 'Avg Valuation'}
                    </p>
                    <p className="text-2xl font-bold">$675M</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {language === 'zh' ? '最新融资轮次' : 'Latest Funding Rounds'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? 'RootData提供的实时加密项目融资动态追踪' : 'Track crypto project funding activities in real-time powered by RootData'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fundingRounds.map((round) => (
                  <div key={round.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {language === 'zh' ? round.projectNameZh : round.projectName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {round.round} • {round.date}
                        </p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500">
                        {round.amount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{language === 'zh' ? '估值' : 'Valuation'}: {round.valuation}</span>
                        <span>{language === 'zh' ? '领投' : 'Lead'}: {round.lead}</span>
                        <Badge variant="outline" className="text-xs">
                          {round.category}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        {language === 'zh' ? '查看详情' : 'Details'}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? '查看更多融资信息' : 'View more funding data'}
                  </div>
                  <a 
                    href="https://cn.rootdata.com/Fundraising" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {language === 'zh' ? '访问 RootData' : 'Visit RootData'}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investor-analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'zh' ? '投资者组合分析' : 'Investor Portfolio Analysis'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '分析投资者的投资组合和策略' : 'Analyze investor portfolios and investment strategies'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input 
                  placeholder={language === 'zh' ? '输入投资者名称或地址' : 'Enter investor name or address'} 
                  className="flex-1"
                />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '分析' : 'Analyze'}
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">
                      {language === 'zh' ? '投资分布' : 'Investment Distribution'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>DeFi</span>
                        <span>35%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Infrastructure</span>
                        <span>28%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gaming</span>
                        <span>20%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>NFT</span>
                        <span>17%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">
                      {language === 'zh' ? '投资阶段' : 'Investment Stages'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Seed</span>
                        <span>12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Series A</span>
                        <span>8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Series B</span>
                        <span>4</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Strategic</span>
                        <span>3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}