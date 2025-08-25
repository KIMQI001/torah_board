"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Coins,
  Image,
  Code,
  Search,
  Plus,
  Settings
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export function SolanaTools() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="spl-token" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spl-token">
            <Coins className="h-4 w-4 mr-2" />
            {language === 'zh' ? 'SPL 代币' : 'SPL Tokens'}
          </TabsTrigger>
          <TabsTrigger value="nft-minter">
            <Image className="h-4 w-4 mr-2" />
            {language === 'zh' ? 'NFT 铸造' : 'NFT Minting'}
          </TabsTrigger>
          <TabsTrigger value="program-analyzer">
            <Code className="h-4 w-4 mr-2" />
            {language === 'zh' ? '程序分析' : 'Program Analysis'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spl-token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {language === 'zh' ? 'SPL 代币创建器' : 'SPL Token Creator'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '在 Solana 上创建和部署 SPL 代币' : 'Create and deploy SPL tokens on Solana'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? 'SPL 代币工具开发中' : 'SPL Token Tools Coming Soon'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'zh' 
                  ? '我们正在开发完整的 SPL 代币管理功能'
                  : 'We are developing comprehensive SPL token management features'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nft-minter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                {language === 'zh' ? 'NFT 批量铸造器' : 'NFT Batch Minter'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '批量铸造 NFT 集合' : 'Mint NFT collections in batches'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? 'NFT 铸造工具开发中' : 'NFT Minting Tools Coming Soon'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'zh' 
                  ? '我们正在开发高效的 NFT 批量铸造功能'
                  : 'We are developing efficient NFT batch minting features'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program-analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {language === 'zh' ? 'Solana 程序分析器' : 'Solana Program Analyzer'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '分析 Solana 程序和智能合约' : 'Analyze Solana programs and smart contracts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? '程序分析工具开发中' : 'Program Analysis Tools Coming Soon'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'zh' 
                  ? '我们正在开发强大的程序分析和调试功能'
                  : 'We are developing powerful program analysis and debugging features'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}