"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Database, Wrench, Github } from "lucide-react";

export default function RootDataPage() {
  
  // 打开项目来源链接
  const openRootData = () => {
    window.open('https://cn.rootdata.com/', '_blank');
  };

  // 打开工具链接
  const openGithub = () => {
    window.open('https://github.com/dandan0x1', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">项目巡猎</h1>
          <p className="text-muted-foreground">
            发现优质区块链项目，挖掘早期空投机会
          </p>
        </div>
      </div>

      {/* 两个大类卡片 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 项目来源 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span>项目来源</span>
            </CardTitle>
            <CardDescription>
              权威的区块链项目数据库和信息来源
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={openRootData}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                RootData - 区块链项目数据库
              </Button>
              
              {/* 预留更多项目来源位置 */}
              <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  更多项目来源即将推出...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工具合集 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-green-500" />
              <span>工具合集</span>
            </CardTitle>
            <CardDescription>
              空投追踪、项目分析和开发工具资源
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
                GitHub - dandan0x1
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

      {/* 快速指南 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">项目筛选建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                • 关注知名 VC 投资的项目
              </p>
              <p className="text-sm">
                • 优先选择有真实用例的项目
              </p>
              <p className="text-sm">
                • 查看团队背景和技术实力
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">空投策略</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                • 早期参与测试网活动
              </p>
              <p className="text-sm">
                • 保持活跃的交互记录
              </p>
              <p className="text-sm">
                • 关注官方社交媒体
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">风险提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-amber-600">
                • 注意项目的真实性
              </p>
              <p className="text-sm text-amber-600">
                • 避免投入过多资金
              </p>
              <p className="text-sm text-amber-600">
                • 谨防钓鱼网站和诈骗
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}