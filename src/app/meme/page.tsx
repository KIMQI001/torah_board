"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Wrench, Github } from "lucide-react";

export default function MemePage() {
  
  // 打开市场平台链接
  const openGMGN = () => {
    window.open('https://gmgn.ai/?tab=home&launchpad=tf&2mim=15000&2im=1&2mac=60&2ic=1&3mim=30000&3im=1&4mim=10000&4im=1&4miv=10000&4iv=1&chain=sol&ref=QLxw1Nuz&2miv=10000&2iv=1&3mitf=1&2mitf=1&4mitf=0.3', '_blank');
  };

  const openOKX = () => {
    window.open('https://web3.okx.com/zh-hans/meme-pump', '_blank');
  };

  const openAxiom = () => {
    window.open('https://axiom.trade/discover', '_blank');
  };

  // 打开工具链接
  const openGithub = () => {
    window.open('https://github.com/topics/meme-coin', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meme 币中心</h1>
          <p className="text-muted-foreground">
            Meme 币市场分析、工具集合和趋势追踪
          </p>
        </div>
      </div>

      {/* 两个大类卡片 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Meme 市场 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Meme 市场</span>
            </CardTitle>
            <CardDescription>
              热门 Meme 币交易和分析平台
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={openGMGN}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                GMGN - Solana Meme 币分析
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={openOKX}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                OKX Meme Pump - 交易平台
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={openAxiom}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Axiom Trade - DeFi 交易
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meme 工具 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              <span>Meme 工具</span>
            </CardTitle>
            <CardDescription>
              开发工具、分析工具和社区资源
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={openGithub}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub - Meme 币相关项目
              </Button>
              
              {/* 预留更多工具位置 */}
              <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  更多工具即将推出...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">市场概况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Meme 币总市值</span>
                <span className="font-medium">$27.7B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">24h 成交量</span>
                <span className="font-medium">$2.3B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">热门币涨幅</span>
                <span className="font-medium text-green-500">+18.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">平台推荐</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">GMGN</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">推荐</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">LogEarn</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">内嵌</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">OKX</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">交易</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">快速导航</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                • 查看 <span className="text-blue-500 font-medium">LogEarn</span> 趋势榜
              </p>
              <p className="text-sm">
                • 访问各大交易平台
              </p>
              <p className="text-sm">
                • 探索开发工具资源
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}