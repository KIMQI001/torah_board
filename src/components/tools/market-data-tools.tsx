"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell,
  Zap,
  Activity,
  TrendingUp,
  Plus,
  Settings
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useToolsStore } from "@/components/tools/tools-store"
import { useState } from "react"

export function MarketDataTools() {
  const { language } = useLanguage()
  const { priceAlerts, addPriceAlert, removePriceAlert, togglePriceAlert } = useToolsStore()
  
  const [newAlert, setNewAlert] = useState({
    tokenSymbol: '',
    tokenAddress: '',
    condition: 'above' as 'above' | 'below',
    price: 0
  })

  const handleAddAlert = () => {
    if (newAlert.tokenSymbol && newAlert.price > 0) {
      addPriceAlert({
        tokenSymbol: newAlert.tokenSymbol,
        tokenAddress: newAlert.tokenAddress || newAlert.tokenSymbol,
        condition: newAlert.condition,
        price: newAlert.price,
        isActive: true
      })
      setNewAlert({
        tokenSymbol: '',
        tokenAddress: '',
        condition: 'above',
        price: 0
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="price-monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="price-monitor">
            <Bell className="h-4 w-4 mr-2" />
            {language === 'zh' ? '价格监控' : 'Price Monitor'}
          </TabsTrigger>
          <TabsTrigger value="arbitrage">
            <Zap className="h-4 w-4 mr-2" />
            {language === 'zh' ? '套利扫描' : 'Arbitrage Scanner'}
          </TabsTrigger>
          <TabsTrigger value="liquidity">
            <Activity className="h-4 w-4 mr-2" />
            {language === 'zh' ? '流动性分析' : 'Liquidity Analysis'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price-monitor" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 价格警报创建 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {language === 'zh' ? '创建价格警报' : 'Create Price Alert'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh' ? '设置代币价格监控警报' : 'Set up token price monitoring alerts'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === 'zh' ? '代币符号' : 'Token Symbol'}
                  </label>
                  <Input
                    placeholder="SOL, USDC, etc."
                    value={newAlert.tokenSymbol}
                    onChange={(e) => setNewAlert({...newAlert, tokenSymbol: e.target.value.toUpperCase()})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {language === 'zh' ? '条件' : 'Condition'}
                    </label>
                    <select 
                      value={newAlert.condition} 
                      onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as 'above' | 'below'})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="above">{language === 'zh' ? '高于' : 'Above'}</option>
                      <option value="below">{language === 'zh' ? '低于' : 'Below'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {language === 'zh' ? '价格 (USD)' : 'Price (USD)'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAlert.price || ''}
                      onChange={(e) => setNewAlert({...newAlert, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <Button onClick={handleAddAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '添加警报' : 'Add Alert'}
                </Button>
              </CardContent>
            </Card>

            {/* 价格警报列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'zh' ? '活跃警报' : 'Active Alerts'}</span>
                  <Badge variant="outline">
                    {priceAlerts.filter(a => a.isActive).length} {language === 'zh' ? '个' : 'active'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priceAlerts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {priceAlerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{alert.tokenSymbol}</Badge>
                            <span className="text-sm">
                              {alert.condition === 'above' ? '>' : '<'} ${alert.price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePriceAlert(alert.id)}
                            >
                              {alert.isActive ? (
                                <Bell className="h-3 w-3 text-green-500" />
                              ) : (
                                <Bell className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePriceAlert(alert.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'zh' ? '创建于' : 'Created'}: {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'zh' ? '还没有价格警报' : 'No price alerts yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {language === 'zh' ? '套利机会扫描器' : 'Arbitrage Opportunity Scanner'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '在不同 DEX 中寻找套利机会' : 'Find arbitrage opportunities across DEXs'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '套利扫描器开发中' : 'Arbitrage Scanner Coming Soon'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'zh' 
                  ? '我们正在开发实时套利机会检测功能'
                  : 'We are developing real-time arbitrage opportunity detection'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {language === 'zh' ? '流动性池分析器' : 'Liquidity Pool Analyzer'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '分析流动性池和交易量' : 'Analyze liquidity pools and trading volumes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '流动性分析工具开发中' : 'Liquidity Analysis Tools Coming Soon'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'zh' 
                  ? '我们正在开发深度流动性分析功能'
                  : 'We are developing comprehensive liquidity analysis features'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}