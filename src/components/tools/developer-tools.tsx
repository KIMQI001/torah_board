"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileCode,
  Server,
  Bug,
  Download,
  Play,
  Settings
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export function DeveloperTools() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="anchor-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="anchor-generator">
            <FileCode className="h-4 w-4 mr-2" />
            {language === 'zh' ? 'Anchor 生成器' : 'Anchor Generator'}
          </TabsTrigger>
          <TabsTrigger value="rpc-tester">
            <Server className="h-4 w-4 mr-2" />
            {language === 'zh' ? 'RPC 测试器' : 'RPC Tester'}
          </TabsTrigger>
          <TabsTrigger value="program-debugger">
            <Bug className="h-4 w-4 mr-2" />
            {language === 'zh' ? '程序调试器' : 'Program Debugger'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anchor-generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {language === 'zh' ? 'Anchor 项目生成器' : 'Anchor Project Generator'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '生成 Anchor 项目模板和样板代码' : 'Generate Anchor project templates and boilerplate code'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <FileCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? 'Anchor 生成器开发中' : 'Anchor Generator Coming Soon'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'zh' 
                  ? '我们正在开发 Anchor 项目快速生成功能'
                  : 'We are developing Anchor project quick generation features'
                }
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">
                  {language === 'zh' ? '项目模板' : 'Project Templates'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '代码生成' : 'Code Generation'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '配置管理' : 'Config Management'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rpc-tester" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {language === 'zh' ? 'RPC 节点测试器' : 'RPC Node Tester'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '测试和基准测试 Solana RPC 节点性能' : 'Test and benchmark Solana RPC node performance'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? 'RPC 测试工具开发中' : 'RPC Testing Tools Coming Soon'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'zh' 
                  ? '我们正在开发 RPC 节点性能测试和监控功能'
                  : 'We are developing RPC node performance testing and monitoring features'
                }
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">
                  {language === 'zh' ? '延迟测试' : 'Latency Testing'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '性能基准' : 'Performance Benchmark'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '节点监控' : 'Node Monitoring'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program-debugger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                {language === 'zh' ? 'Solana 程序调试器' : 'Solana Program Debugger'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '调试 Solana 程序和交易' : 'Debug Solana programs and transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Bug className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '程序调试器开发中' : 'Program Debugger Coming Soon'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'zh' 
                  ? '我们正在开发强大的程序调试和错误分析功能'
                  : 'We are developing powerful program debugging and error analysis features'
                }
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">
                  {language === 'zh' ? '交易分析' : 'Transaction Analysis'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '错误诊断' : 'Error Diagnosis'}
                </Badge>
                <Badge variant="outline">
                  {language === 'zh' ? '日志解析' : 'Log Parsing'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}