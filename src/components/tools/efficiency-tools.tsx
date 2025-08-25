"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Wallet,
  Send,
  Shield,
  Key,
  Copy,
  Download,
  Upload,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useToolsStore, type WalletResult, type BatchTransferRecord } from "@/components/tools/tools-store"
import { useState } from "react"

export function EfficiencyTools() {
  const { t, language } = useLanguage()
  const { 
    generatedWallets,
    batchTransfers,
    addGeneratedWallet,
    removeGeneratedWallet,
    clearGeneratedWallets,
    addBatchTransfer
  } = useToolsStore()
  
  // 批量钱包生成状态
  const [walletCount, setWalletCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPrivateKeys, setShowPrivateKeys] = useState(false)
  
  // 批量转账状态
  const [transferFrom, setTransferFrom] = useState('')
  const [transferList, setTransferList] = useState('')
  const [transferToken, setTransferToken] = useState('SOL')
  const [isTransferring, setIsTransferring] = useState(false)

  // 生成钱包
  const generateWallets = async () => {
    setIsGenerating(true)
    
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    for (let i = 0; i < walletCount; i++) {
      const wallet: WalletResult = {
        id: Date.now().toString() + i,
        publicKey: generateMockSolanaAddress(),
        privateKey: generateMockPrivateKey(),
        mnemonic: generateMockMnemonic(),
        derivationPath: `m/44'/501'/${i}'/0'`,
        createdAt: new Date().toISOString()
      }
      addGeneratedWallet(wallet)
    }
    
    setIsGenerating(false)
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // 这里可以添加成功提示
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 导出钱包数据
  const exportWallets = () => {
    const data = JSON.stringify(generatedWallets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solana-wallets-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 处理批量转账
  const handleBatchTransfer = async () => {
    if (!transferFrom || !transferList) return
    
    setIsTransferring(true)
    
    // 解析转账列表
    const transfers = transferList.split('\n').filter(line => line.trim()).map((line, index) => {
      const parts = line.trim().split(/\s+/)
      const toAddress = parts[0]
      const amount = parseFloat(parts[1] || '0')
      
      return {
        toAddress,
        amount,
        token: transferToken,
        status: 'pending' as const
      }
    })
    
    const batchTransfer: BatchTransferRecord = {
      id: Date.now().toString(),
      fromAddress: transferFrom,
      transfers,
      createdAt: new Date().toISOString(),
      totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0)
    }
    
    addBatchTransfer(batchTransfer)
    
    // 模拟转账过程
    setTimeout(() => {
      setIsTransferring(false)
      setTransferList('')
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="batch-wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batch-wallets">
            <Wallet className="h-4 w-4 mr-2" />
            {language === 'zh' ? '批量钱包' : 'Batch Wallets'}
          </TabsTrigger>
          <TabsTrigger value="bulk-transfer">
            <Send className="h-4 w-4 mr-2" />
            {language === 'zh' ? '批量转账' : 'Bulk Transfer'}
          </TabsTrigger>
          <TabsTrigger value="multisig">
            <Shield className="h-4 w-4 mr-2" />
            {language === 'zh' ? '多签管理' : 'Multisig'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch-wallets" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 钱包生成器 */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {language === 'zh' ? '钱包生成器' : 'Wallet Generator'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'zh' ? '批量生成 Solana 钱包地址' : 'Generate multiple Solana wallet addresses'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {language === 'zh' ? '生成数量' : 'Number of Wallets'}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={walletCount}
                      onChange={(e) => setWalletCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPrivateKeys"
                      checked={showPrivateKeys}
                      onChange={(e) => setShowPrivateKeys(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="showPrivateKeys" className="text-sm">
                      {language === 'zh' ? '显示私钥' : 'Show Private Keys'}
                    </label>
                  </div>
                  
                  <Button 
                    onClick={generateWallets}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'zh' ? '生成中...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '生成钱包' : 'Generate Wallets'}
                      </>
                    )}
                  </Button>
                  
                  {generatedWallets.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportWallets} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '导出' : 'Export'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearGeneratedWallets} className="flex-1">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '清空' : 'Clear'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 钱包列表 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{language === 'zh' ? '生成的钱包' : 'Generated Wallets'}</span>
                    <Badge variant="outline">
                      {generatedWallets.length} {language === 'zh' ? '个' : 'wallets'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedWallets.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {generatedWallets.map((wallet, index) => (
                        <div key={wallet.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {language === 'zh' ? '钱包' : 'Wallet'} #{index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGeneratedWallet(wallet.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">{language === 'zh' ? '地址' : 'Address'}:</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(wallet.publicKey)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {showPrivateKeys && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">{language === 'zh' ? '私钥' : 'Private Key'}:</span>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {wallet.privateKey.slice(0, 8)}...{wallet.privateKey.slice(-8)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(wallet.privateKey)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {wallet.mnemonic && (
                              <div className="pt-2 border-t">
                                <span className="text-muted-foreground text-xs">{language === 'zh' ? '助记词' : 'Mnemonic'}:</span>
                                <p className="text-xs bg-muted p-2 rounded font-mono mt-1">
                                  {wallet.mnemonic}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === 'zh' ? '还没有生成任何钱包' : 'No wallets generated yet'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk-transfer" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 转账配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {language === 'zh' ? '批量转账设置' : 'Bulk Transfer Setup'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh' ? '配置批量转账参数' : 'Configure bulk transfer parameters'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === 'zh' ? '发送方地址' : 'From Address'}
                  </label>
                  <Input
                    placeholder={language === 'zh' ? '输入发送方钱包地址' : 'Enter sender wallet address'}
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === 'zh' ? '代币类型' : 'Token Type'}
                  </label>
                  <select 
                    value={transferToken} 
                    onChange={(e) => setTransferToken(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === 'zh' ? '转账列表' : 'Transfer List'}
                  </label>
                  <Textarea
                    placeholder={language === 'zh' 
                      ? '每行一个地址和金额，用空格分隔\n例如：\nAddress1 1.5\nAddress2 2.0\nAddress3 0.8'
                      : 'One address and amount per line, separated by space\nExample:\nAddress1 1.5\nAddress2 2.0\nAddress3 0.8'
                    }
                    value={transferList}
                    onChange={(e) => setTransferList(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleBatchTransfer}
                  disabled={isTransferring || !transferFrom || !transferList}
                  className="w-full"
                >
                  {isTransferring ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'zh' ? '转账中...' : 'Transferring...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {language === 'zh' ? '开始转账' : 'Start Transfer'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 转账历史 */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'zh' ? '转账历史' : 'Transfer History'}</CardTitle>
                <CardDescription>
                  {language === 'zh' ? '查看批量转账记录' : 'View bulk transfer records'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchTransfers.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {batchTransfers.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {language === 'zh' ? '批次' : 'Batch'} #{batch.id.slice(-4)}
                            </span>
                            <Badge variant="outline">
                              {batch.transfers.length} {language === 'zh' ? '笔' : 'transfers'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {language === 'zh' ? '发送方' : 'From'}: 
                          <code className="ml-1 text-xs bg-muted px-1 rounded">
                            {batch.fromAddress.slice(0, 8)}...{batch.fromAddress.slice(-8)}
                          </code>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3">
                          {language === 'zh' ? '总金额' : 'Total Amount'}: 
                          <span className="ml-1 font-medium">{batch.totalAmount} SOL</span>
                        </div>
                        
                        <div className="space-y-1">
                          {batch.transfers.slice(0, 3).map((transfer, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <code className="bg-muted px-1 rounded">
                                {transfer.toAddress.slice(0, 8)}...{transfer.toAddress.slice(-8)}
                              </code>
                              <div className="flex items-center gap-2">
                                <span>{transfer.amount} {transfer.token}</span>
                                {transfer.status === 'success' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : transfer.status === 'failed' ? (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                ) : (
                                  <Clock className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          ))}
                          {batch.transfers.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{batch.transfers.length - 3} {language === 'zh' ? '更多' : 'more'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'zh' ? '还没有转账记录' : 'No transfer records yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multisig" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {language === 'zh' ? '多签钱包管理' : 'Multisig Wallet Management'}
              </CardTitle>
              <CardDescription>
                {language === 'zh' ? '创建和管理多重签名钱包' : 'Create and manage multi-signature wallets'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '多签功能开发中' : 'Multisig Feature Coming Soon'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'zh' 
                    ? '我们正在开发安全的多重签名钱包管理功能，包括创建、签名和执行多签交易。'
                    : 'We are developing secure multi-signature wallet management features, including creating, signing, and executing multisig transactions.'
                  }
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">
                    {language === 'zh' ? '钱包创建' : 'Wallet Creation'}
                  </Badge>
                  <Badge variant="outline">
                    {language === 'zh' ? '签名管理' : 'Signature Management'}
                  </Badge>
                  <Badge variant="outline">
                    {language === 'zh' ? '交易执行' : 'Transaction Execution'}
                  </Badge>
                  <Badge variant="outline">
                    {language === 'zh' ? '权限控制' : 'Permission Control'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 模拟函数
function generateMockSolanaAddress(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  let result = ''
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateMockPrivateKey(): string {
  const hex = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += hex.charAt(Math.floor(Math.random() * hex.length))
  }
  return result
}

function generateMockMnemonic(): string {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
  ]
  
  const mnemonic = []
  for (let i = 0; i < 12; i++) {
    mnemonic.push(words[Math.floor(Math.random() * words.length)])
  }
  return mnemonic.join(' ')
}