"use client"

import React, { useState, useEffect, createContext, useContext } from 'react'

// 工具分类定义
export type ToolCategory = 
  | 'funding'     // 融资信息
  | 'efficiency'  // 效率工具
  | 'solana'      // Solana 专用
  | 'market'      // 市场数据
  | 'security'    // 安全工具
  | 'developer'   // 开发者工具

// 工具状态
export type ToolStatus = 'active' | 'beta' | 'coming-soon'

// 单个工具定义
export interface Tool {
  id: string
  name: string
  nameZh: string
  description: string
  descriptionZh: string
  category: ToolCategory
  status: ToolStatus
  icon: string
  featured?: boolean
  tags: string[]
  lastUsed?: string
  useCount: number
  externalUrl?: string // 外部链接
}

// VC 数据结构
export interface VCData {
  id: string
  name: string
  nameZh: string
  description: string
  descriptionZh: string
  website: string
  twitter: string
  focus: string[]
  location: string
  aum: string // Assets Under Management
  portfolioCount: number
  recentInvestments: Investment[]
}

// 投资记录
export interface Investment {
  id: string
  projectName: string
  projectNameZh: string
  round: string
  amount: string
  date: string
  valuation?: string
  status: 'active' | 'exited' | 'failed'
}

// 钱包生成结果
export interface WalletResult {
  id: string
  publicKey: string
  privateKey: string
  mnemonic?: string
  derivationPath?: string
  createdAt: string
}

// 批量转账记录
export interface BatchTransferRecord {
  id: string
  fromAddress: string
  transfers: {
    toAddress: string
    amount: number
    token: string
    status: 'pending' | 'success' | 'failed'
    txHash?: string
  }[]
  createdAt: string
  totalAmount: number
}

// 价格警报
export interface PriceAlert {
  id: string
  tokenSymbol: string
  tokenAddress: string
  condition: 'above' | 'below'
  price: number
  isActive: boolean
  createdAt: string
  triggeredAt?: string
}

// 工具存储状态
interface ToolsStore {
  // 基础数据
  tools: Tool[]
  categories: { id: ToolCategory; name: string; nameZh: string; description: string; descriptionZh: string }[]
  
  // 使用统计
  toolUsageStats: Record<string, number>
  
  // VC 数据
  vcData: VCData[]
  favoriteVCs: string[]
  
  // 效率工具数据
  generatedWallets: WalletResult[]
  batchTransfers: BatchTransferRecord[]
  
  // 市场数据
  priceAlerts: PriceAlert[]
  watchedTokens: string[]
  
  // 偏好设置
  favoriteTools: string[]
  recentlyUsed: string[]
  
  // 操作方法
  incrementToolUsage: (toolId: string) => void
  addToFavorites: (toolId: string) => void
  removeFromFavorites: (toolId: string) => void
  addToRecentlyUsed: (toolId: string) => void
  
  // VC 数据操作
  addVCToFavorites: (vcId: string) => void
  removeVCFromFavorites: (vcId: string) => void
  
  // 钱包操作
  addGeneratedWallet: (wallet: WalletResult) => void
  removeGeneratedWallet: (walletId: string) => void
  clearGeneratedWallets: () => void
  
  // 批量转账操作
  addBatchTransfer: (transfer: BatchTransferRecord) => void
  updateTransferStatus: (transferId: string, transferIndex: number, status: 'success' | 'failed', txHash?: string) => void
  
  // 价格警报操作
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void
  removePriceAlert: (alertId: string) => void
  togglePriceAlert: (alertId: string) => void
  
  // 代币监控
  addWatchedToken: (tokenAddress: string) => void
  removeWatchedToken: (tokenAddress: string) => void
}

// 默认工具数据
const defaultTools: Tool[] = [
  // 融资信息工具
  {
    id: 'vc-database',
    name: 'VC Database',
    nameZh: 'VC 数据库',
    description: 'Search and analyze venture capital firms and their investment history',
    descriptionZh: '搜索和分析风险投资公司及其投资历史',
    category: 'funding',
    status: 'active',
    icon: 'building-2',
    featured: true,
    tags: ['vc', 'funding', 'investment', 'database'],
    useCount: 0
  },
  {
    id: 'funding-tracker',
    name: 'Funding Tracker',
    nameZh: '融资追踪器',
    description: 'Track funding rounds and valuations powered by RootData - comprehensive crypto funding database',
    descriptionZh: '基于RootData的融资追踪器 - 全面的加密货币融资数据库，追踪项目融资轮次和估值信息',
    category: 'funding',
    status: 'active',
    icon: 'trending-up',
    featured: true,
    tags: ['funding', 'valuation', 'rounds', 'tracking', 'rootdata'],
    useCount: 0,
    externalUrl: 'https://cn.rootdata.com/Fundraising'
  },
  {
    id: 'investor-analyzer',
    name: 'Investor Analyzer',
    nameZh: '投资者分析器',
    description: 'Analyze investor portfolios and investment patterns',
    descriptionZh: '分析投资者投资组合和投资模式',
    category: 'funding',
    status: 'beta',
    icon: 'users',
    tags: ['investor', 'portfolio', 'analysis'],
    useCount: 0
  },
  
  // 效率工具
  {
    id: 'batch-wallet-generator',
    name: 'Batch Wallet Generator',
    nameZh: '批量钱包生成器',
    description: 'Generate multiple Solana wallets with mnemonic phrases',
    descriptionZh: '批量生成带助记词的 Solana 钱包',
    category: 'efficiency',
    status: 'active',
    icon: 'wallet',
    featured: true,
    tags: ['wallet', 'generator', 'batch', 'mnemonic'],
    useCount: 0
  },
  {
    id: 'bulk-transfer',
    name: 'Bulk Transfer',
    nameZh: '批量转账',
    description: 'Send tokens to multiple addresses in one transaction',
    descriptionZh: '在一个交易中向多个地址发送代币',
    category: 'efficiency',
    status: 'active',
    icon: 'send',
    tags: ['transfer', 'bulk', 'batch', 'tokens'],
    useCount: 0
  },
  {
    id: 'multisig-manager',
    name: 'Multisig Manager',
    nameZh: '多签管理器',
    description: 'Create and manage multi-signature wallets',
    descriptionZh: '创建和管理多重签名钱包',
    category: 'efficiency',
    status: 'beta',
    icon: 'shield-check',
    tags: ['multisig', 'security', 'wallet'],
    useCount: 0
  },
  
  // Solana 专用工具
  {
    id: 'spl-token-creator',
    name: 'SPL Token Creator',
    nameZh: 'SPL 代币创建器',
    description: 'Create and deploy SPL tokens on Solana',
    descriptionZh: '在 Solana 上创建和部署 SPL 代币',
    category: 'solana',
    status: 'active',
    icon: 'coins',
    featured: true,
    tags: ['spl', 'token', 'create', 'deploy'],
    useCount: 0
  },
  {
    id: 'nft-minter',
    name: 'NFT Batch Minter',
    nameZh: 'NFT 批量铸造器',
    description: 'Mint NFT collections on Solana',
    descriptionZh: '在 Solana 上批量铸造 NFT 集合',
    category: 'solana',
    status: 'active',
    icon: 'image',
    tags: ['nft', 'mint', 'collection', 'batch'],
    useCount: 0
  },
  {
    id: 'program-analyzer',
    name: 'Program Analyzer',
    nameZh: '程序分析器',
    description: 'Analyze Solana programs and their interactions',
    descriptionZh: '分析 Solana 程序及其交互',
    category: 'solana',
    status: 'beta',
    icon: 'code',
    tags: ['program', 'analysis', 'smart-contract'],
    useCount: 0
  },
  {
    id: 'account-explorer',
    name: 'Account Explorer',
    nameZh: '账户浏览器',
    description: 'Explore Solana accounts, balances, and transaction history',
    descriptionZh: '浏览 Solana 账户、余额和交易历史',
    category: 'solana',
    status: 'active',
    icon: 'search',
    tags: ['account', 'explorer', 'balance', 'history'],
    useCount: 0
  },
  
  // 市场数据工具
  {
    id: 'price-monitor',
    name: 'Price Monitor',
    nameZh: '价格监控器',
    description: 'Monitor token prices and set alerts',
    descriptionZh: '监控代币价格并设置警报',
    category: 'market',
    status: 'active',
    icon: 'bell',
    featured: true,
    tags: ['price', 'monitor', 'alert', 'notification'],
    useCount: 0
  },
  {
    id: 'arbitrage-scanner',
    name: 'Arbitrage Scanner',
    nameZh: '套利扫描器',
    description: 'Find arbitrage opportunities across DEXs',
    descriptionZh: '在各个 DEX 中寻找套利机会',
    category: 'market',
    status: 'active',
    icon: 'zap',
    tags: ['arbitrage', 'dex', 'opportunities', 'profit'],
    useCount: 0
  },
  {
    id: 'liquidity-analyzer',
    name: 'Liquidity Analyzer',
    nameZh: '流动性分析器',
    description: 'Analyze liquidity pools and trading volumes',
    descriptionZh: '分析流动性池和交易量',
    category: 'market',
    status: 'beta',
    icon: 'activity',
    tags: ['liquidity', 'pool', 'volume', 'analysis'],
    useCount: 0
  },
  
  // 安全工具
  {
    id: 'contract-auditor',
    name: 'Contract Auditor',
    nameZh: '合约审计器',
    description: 'Audit smart contracts for security vulnerabilities',
    descriptionZh: '审计智能合约的安全漏洞',
    category: 'security',
    status: 'beta',
    icon: 'shield',
    tags: ['audit', 'security', 'vulnerability', 'contract'],
    useCount: 0
  },
  {
    id: 'wallet-checker',
    name: 'Wallet Security Checker',
    nameZh: '钱包安全检查器',
    description: 'Check wallet security and token approvals',
    descriptionZh: '检查钱包安全性和代币授权',
    category: 'security',
    status: 'active',
    icon: 'shield-check',
    tags: ['wallet', 'security', 'approval', 'check'],
    useCount: 0
  },
  {
    id: 'risk-assessor',
    name: 'Transaction Risk Assessor',
    nameZh: '交易风险评估器',
    description: 'Assess transaction risks and simulate outcomes',
    descriptionZh: '评估交易风险并模拟结果',
    category: 'security',
    status: 'coming-soon',
    icon: 'alert-triangle',
    tags: ['risk', 'transaction', 'simulation', 'assessment'],
    useCount: 0
  },
  
  // 开发者工具
  {
    id: 'anchor-generator',
    name: 'Anchor Project Generator',
    nameZh: 'Anchor 项目生成器',
    description: 'Generate boilerplate Anchor projects',
    descriptionZh: '生成 Anchor 项目模板',
    category: 'developer',
    status: 'active',
    icon: 'file-code',
    tags: ['anchor', 'template', 'boilerplate', 'generator'],
    useCount: 0
  },
  {
    id: 'rpc-tester',
    name: 'RPC Node Tester',
    nameZh: 'RPC 节点测试器',
    description: 'Test and benchmark Solana RPC nodes',
    descriptionZh: '测试和基准测试 Solana RPC 节点',
    category: 'developer',
    status: 'active',
    icon: 'server',
    tags: ['rpc', 'node', 'test', 'benchmark'],
    useCount: 0
  },
  {
    id: 'program-debugger',
    name: 'Program Debugger',
    nameZh: '程序调试器',
    description: 'Debug Solana programs and transactions',
    descriptionZh: '调试 Solana 程序和交易',
    category: 'developer',
    status: 'beta',
    icon: 'bug',
    tags: ['debug', 'program', 'transaction', 'development'],
    useCount: 0
  }
]

// 默认 VC 数据
const defaultVCData: VCData[] = [
  {
    id: 'solana-ventures',
    name: 'Solana Ventures',
    nameZh: 'Solana Ventures',
    description: 'Focused on investing in the Solana ecosystem',
    descriptionZh: '专注于投资 Solana 生态系统',
    website: 'https://solana.ventures',
    twitter: '@SolanaVentures',
    focus: ['Infrastructure', 'DeFi', 'Gaming', 'NFTs'],
    location: 'Global',
    aum: '$100M+',
    portfolioCount: 45,
    recentInvestments: [
      {
        id: '1',
        projectName: 'Magic Eden',
        projectNameZh: 'Magic Eden',
        round: 'Series B',
        amount: '$27M',
        date: '2024-02-15',
        valuation: '$1.6B',
        status: 'active'
      }
    ]
  },
  {
    id: 'jump-crypto',
    name: 'Jump Crypto',
    nameZh: 'Jump Crypto',
    description: 'Premier crypto-focused investment firm',
    descriptionZh: '顶级加密货币投资公司',
    website: 'https://jumpcrypto.com',
    twitter: '@JumpCrypto',
    focus: ['Infrastructure', 'DeFi', 'Layer 1', 'MEV'],
    location: 'Chicago, USA',
    aum: '$2B+',
    portfolioCount: 78,
    recentInvestments: [
      {
        id: '2',
        projectName: 'Wormhole',
        projectNameZh: 'Wormhole',
        round: 'Series A',
        amount: '$225M',
        date: '2024-01-20',
        valuation: '$2.5B',
        status: 'active'
      }
    ]
  },
  {
    id: 'multicoin-capital',
    name: 'Multicoin Capital',
    nameZh: 'Multicoin Capital',
    description: 'Thesis-driven crypto investment firm',
    descriptionZh: '基于论点驱动的加密投资公司',
    website: 'https://multicoin.capital',
    twitter: '@multicoinkapital',
    focus: ['Web3', 'DeFi', 'Infrastructure', 'Gaming'],
    location: 'Austin, USA',
    aum: '$800M+',
    portfolioCount: 62,
    recentInvestments: [
      {
        id: '3',
        projectName: 'Helium',
        projectNameZh: 'Helium',
        round: 'Series D',
        amount: '$200M',
        date: '2023-12-10',
        valuation: '$1.2B',
        status: 'active'
      }
    ]
  }
]

// 默认分类数据
const defaultCategories = [
  {
    id: 'funding' as ToolCategory,
    name: 'Funding Intelligence',
    nameZh: '融资情报',
    description: 'VC data, funding rounds, and investor analysis',
    descriptionZh: 'VC 数据、融资轮次和投资者分析'
  },
  {
    id: 'efficiency' as ToolCategory,
    name: 'Efficiency Tools',
    nameZh: '效率工具',
    description: 'Batch operations, wallet management, and automation',
    descriptionZh: '批量操作、钱包管理和自动化'
  },
  {
    id: 'solana' as ToolCategory,
    name: 'Solana Tools',
    nameZh: 'Solana 工具',
    description: 'SPL tokens, NFTs, and program utilities',
    descriptionZh: 'SPL 代币、NFT 和程序实用工具'
  },
  {
    id: 'market' as ToolCategory,
    name: 'Market Data',
    nameZh: '市场数据',
    description: 'Price monitoring, arbitrage, and liquidity analysis',
    descriptionZh: '价格监控、套利和流动性分析'
  },
  {
    id: 'security' as ToolCategory,
    name: 'Security Tools',
    nameZh: '安全工具',
    description: 'Contract auditing, wallet security, and risk assessment',
    descriptionZh: '合约审计、钱包安全和风险评估'
  },
  {
    id: 'developer' as ToolCategory,
    name: 'Developer Tools',
    nameZh: '开发者工具',
    description: 'Anchor templates, RPC testing, and debugging',
    descriptionZh: 'Anchor 模板、RPC 测试和调试'
  }
]

// Context for tools data
const ToolsContext = createContext<ToolsStore | undefined>(undefined)

// Hook to use tools context
export function useToolsStore(): ToolsStore {
  const context = useContext(ToolsContext)
  if (!context) {
    throw new Error('useToolsStore must be used within a ToolsProvider')
  }
  return context
}

// Provider component
export function ToolsProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [tools] = useState<Tool[]>(defaultTools)
  const [categories] = useState(defaultCategories)
  const [toolUsageStats, setToolUsageStats] = useState<Record<string, number>>({})
  const [vcData] = useState<VCData[]>(defaultVCData)
  const [favoriteVCs, setFavoriteVCs] = useState<string[]>([])
  const [generatedWallets, setGeneratedWallets] = useState<WalletResult[]>([])
  const [batchTransfers, setBatchTransfers] = useState<BatchTransferRecord[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [watchedTokens, setWatchedTokens] = useState<string[]>([])
  const [favoriteTools, setFavoriteTools] = useState<string[]>([])
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tools-storage')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.toolUsageStats) setToolUsageStats(data.toolUsageStats)
        if (data.favoriteVCs) setFavoriteVCs(data.favoriteVCs)
        if (data.generatedWallets) setGeneratedWallets(data.generatedWallets)
        if (data.batchTransfers) setBatchTransfers(data.batchTransfers)
        if (data.priceAlerts) setPriceAlerts(data.priceAlerts)
        if (data.watchedTokens) setWatchedTokens(data.watchedTokens)
        if (data.favoriteTools) setFavoriteTools(data.favoriteTools)
        if (data.recentlyUsed) setRecentlyUsed(data.recentlyUsed)
      }
    } catch (error) {
      console.error('Failed to load tools data from localStorage:', error)
    }
  }, [])

  // Save data to localStorage
  const saveToStorage = (data: any) => {
    try {
      const currentData = JSON.parse(localStorage.getItem('tools-storage') || '{}')
      const newData = { ...currentData, ...data }
      localStorage.setItem('tools-storage', JSON.stringify(newData))
    } catch (error) {
      console.error('Failed to save tools data to localStorage:', error)
    }
  }

  // Actions
  const incrementToolUsage = (toolId: string) => {
    const newStats = {
      ...toolUsageStats,
      [toolId]: (toolUsageStats[toolId] || 0) + 1
    }
    setToolUsageStats(newStats)
    saveToStorage({ toolUsageStats: newStats })
    addToRecentlyUsed(toolId)
  }

  const addToFavorites = (toolId: string) => {
    const newFavorites = [...new Set([...favoriteTools, toolId])]
    setFavoriteTools(newFavorites)
    saveToStorage({ favoriteTools: newFavorites })
  }

  const removeFromFavorites = (toolId: string) => {
    const newFavorites = favoriteTools.filter(id => id !== toolId)
    setFavoriteTools(newFavorites)
    saveToStorage({ favoriteTools: newFavorites })
  }

  const addToRecentlyUsed = (toolId: string) => {
    const filtered = recentlyUsed.filter(id => id !== toolId)
    const newRecent = [toolId, ...filtered].slice(0, 10)
    setRecentlyUsed(newRecent)
    saveToStorage({ recentlyUsed: newRecent })
  }

  const addVCToFavorites = (vcId: string) => {
    const newFavorites = [...new Set([...favoriteVCs, vcId])]
    setFavoriteVCs(newFavorites)
    saveToStorage({ favoriteVCs: newFavorites })
  }

  const removeVCFromFavorites = (vcId: string) => {
    const newFavorites = favoriteVCs.filter(id => id !== vcId)
    setFavoriteVCs(newFavorites)
    saveToStorage({ favoriteVCs: newFavorites })
  }

  const addGeneratedWallet = (wallet: WalletResult) => {
    const newWallets = [wallet, ...generatedWallets]
    setGeneratedWallets(newWallets)
    saveToStorage({ generatedWallets: newWallets })
  }

  const removeGeneratedWallet = (walletId: string) => {
    const newWallets = generatedWallets.filter(w => w.id !== walletId)
    setGeneratedWallets(newWallets)
    saveToStorage({ generatedWallets: newWallets })
  }

  const clearGeneratedWallets = () => {
    setGeneratedWallets([])
    saveToStorage({ generatedWallets: [] })
  }

  const addBatchTransfer = (transfer: BatchTransferRecord) => {
    const newTransfers = [transfer, ...batchTransfers]
    setBatchTransfers(newTransfers)
    saveToStorage({ batchTransfers: newTransfers })
  }

  const updateTransferStatus = (transferId: string, transferIndex: number, status: 'success' | 'failed', txHash?: string) => {
    const newTransfers = batchTransfers.map(transfer => 
      transfer.id === transferId
        ? {
            ...transfer,
            transfers: transfer.transfers.map((t, index) =>
              index === transferIndex
                ? { ...t, status, txHash }
                : t
            )
          }
        : transfer
    )
    setBatchTransfers(newTransfers)
    saveToStorage({ batchTransfers: newTransfers })
  }

  const addPriceAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const alert: PriceAlert = {
      ...alertData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    const newAlerts = [alert, ...priceAlerts]
    setPriceAlerts(newAlerts)
    saveToStorage({ priceAlerts: newAlerts })
  }

  const removePriceAlert = (alertId: string) => {
    const newAlerts = priceAlerts.filter(alert => alert.id !== alertId)
    setPriceAlerts(newAlerts)
    saveToStorage({ priceAlerts: newAlerts })
  }

  const togglePriceAlert = (alertId: string) => {
    const newAlerts = priceAlerts.map(alert =>
      alert.id === alertId
        ? { ...alert, isActive: !alert.isActive }
        : alert
    )
    setPriceAlerts(newAlerts)
    saveToStorage({ priceAlerts: newAlerts })
  }

  const addWatchedToken = (tokenAddress: string) => {
    const newTokens = [...new Set([...watchedTokens, tokenAddress])]
    setWatchedTokens(newTokens)
    saveToStorage({ watchedTokens: newTokens })
  }

  const removeWatchedToken = (tokenAddress: string) => {
    const newTokens = watchedTokens.filter(addr => addr !== tokenAddress)
    setWatchedTokens(newTokens)
    saveToStorage({ watchedTokens: newTokens })
  }

  // Update tools with usage counts
  const toolsWithUsage = tools.map(tool => ({
    ...tool,
    useCount: toolUsageStats[tool.id] || 0
  }))

  const contextValue: ToolsStore = {
    tools: toolsWithUsage,
    categories,
    toolUsageStats,
    vcData,
    favoriteVCs,
    generatedWallets,
    batchTransfers,
    priceAlerts,
    watchedTokens,
    favoriteTools,
    recentlyUsed,
    incrementToolUsage,
    addToFavorites,
    removeFromFavorites,
    addToRecentlyUsed,
    addVCToFavorites,
    removeVCFromFavorites,
    addGeneratedWallet,
    removeGeneratedWallet,
    clearGeneratedWallets,
    addBatchTransfer,
    updateTransferStatus,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    addWatchedToken,
    removeWatchedToken
  }

  return React.createElement(
    ToolsContext.Provider,
    { value: contextValue },
    children
  )
}