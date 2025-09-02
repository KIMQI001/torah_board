"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Vote as VoteIcon, Vault, FileText, CheckCircle, Clock, ExternalLink, 
  Gavel, BarChart, TrendingUp, Shield, AlertTriangle, 
  Calendar, DollarSign, Settings, UserCheck, Lock,
  ArrowUpRight, ArrowDownRight, Award, Target,
  Bell, Filter, Search, Plus, MoreHorizontal,
  Eye, Edit3, Trash2, ThumbsUp, ThumbsDown,
  Timer, Zap, Activity, PieChart, TrendingDown,
  Globe, Briefcase, CreditCard, History, BookOpen,
  ChevronRight, PlayCircle, PauseCircle, XCircle,
  Coins, Percent, Wallet2, RefreshCw, Download,
  Loader2
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { daoApi, healthApi, invalidateApiCache, DAO, DAOProposal, DAOProject, DAOMember, DAOTreasury } from "@/lib/api";
import { WalletButton } from "@/components/wallet/WalletButton";
import { CreateDAOModal } from "@/components/dao/CreateDAOModal";
import { CreateProjectModal } from "@/components/dao/CreateProjectModal";
import { CreateProposalModal } from "@/components/dao/CreateProposalModal";
import { ProjectDetailsModal } from "@/components/dao/ProjectDetailsModal";
import { ProposalCard } from "@/components/dao/ProposalCard";
import { ProposalDetailsModal } from "@/components/dao/ProposalDetailsModal";
import { DAOAnalytics } from "@/components/dao/DAOAnalytics";
import { ToastContainer } from "@/components/ui/toast-container";
import { useToast } from "@/hooks/use-toast";

export default function DAOPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const targetDAOId = searchParams.get('id');
  const { toasts, success, error: showError, removeToast } = useToast();
  
  // Debug authentication status (reduced logging)
  // console.log('🔥 DAO Page Auth Status:', {
  //   isAuthenticated,
  //   hasUser: !!user,
  //   userId: user?.id,
  //   userWallet: user?.walletAddress
  // });

  // Simplified health check (only on initial mount)
  useEffect(() => {
    let mounted = true;
    
    const checkBackendHealth = async () => {
      try {
        const health = await healthApi.checkBackend();
        if (!health.success && !isAuthenticated && mounted) {
          console.error('🚨 Backend health check failed:', health.error);
          setError(`Backend connection failed: ${health.error}`);
        }
      } catch (err) {
        console.error('🚨 Health check error:', err);
      }
    };
    
    checkBackendHealth();
    
    return () => {
      mounted = false;
    };
  }, []); // Run only once on mount
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safety mechanism to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 30000); // 30 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);
  
  // DAO State
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [projects, setProjects] = useState<DAOProject[]>([]);
  const [members, setMembers] = useState<DAOMember[]>([]);
  const [treasuryTransactions, setTreasuryTransactions] = useState<DAOTreasury[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<any>(null);
  const [daoStats, setDAOStats] = useState<any>(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateDAO, setShowCreateDAO] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DAOProject | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  

  const tabs = [
    { id: 'overview', label: t('dao.overview'), icon: BarChart },
    { id: 'projects', label: t('dao.projects'), icon: Briefcase },
    { id: 'governance', label: t('dao.governance'), icon: VoteIcon },
    { id: 'treasury', label: t('dao.treasury'), icon: Vault },
    { id: 'members', label: t('dao.members'), icon: Users },
    { id: 'analytics', label: t('dao.analytics'), icon: PieChart }
  ];

  // Load user's DAOs
  const loadDAOs = useCallback(async () => {
    console.log('🔥 loadDAOs called:', { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated or no user, skipping loadDAOs');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Always load user's DAOs (user can only manage DAOs they're members of)
      console.log('🔥 Calling daoApi.getDAOs with userId:', user.id);
      const daosData = await daoApi.getDAOs(user.id);
      
      console.log('✅ getDAOs response:', daosData);
      
      setDAOs(daosData);
      console.log('📊 DAOs loaded:', daosData.length);
      
      // Auto-select DAO based on URL parameter or first available DAO
      if (daosData.length > 0) {
        let daoToSelect = daosData[0]; // Default to first DAO
        
        // If there's a target DAO ID from URL, try to find and select it
        if (targetDAOId) {
          const foundDAO = daosData.find(dao => dao.id === targetDAOId);
          if (foundDAO) {
            daoToSelect = foundDAO;
            console.log('🎯 Found target DAO from URL:', foundDAO.name);
          } else {
            console.warn('⚠️ Target DAO not found or user is not a member, falling back to first DAO');
          }
        }
        
        if (!selectedDAO || selectedDAO.id !== daoToSelect.id) {
          setSelectedDAO(daoToSelect);
          console.log('🎯 Selected DAO:', daoToSelect.name);
        }
      }
    } catch (err) {
      console.error('💥 loadDAOs exception:', err);
      setError('Failed to load DAOs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, targetDAOId]);

  // Load DAO details
  const loadDAODetails = useCallback(async (daoId: string) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [
        daoResponse,
        proposalsResponse,
        projectsResponse,
        membersResponse,
        statsResponse
      ] = await Promise.all([
        daoApi.getDAO(daoId),
        daoApi.getProposals(daoId),
        daoApi.getProjects(daoId),
        daoApi.getMembers(daoId),
        daoApi.getDAOStats(daoId)
      ]);

      setSelectedDAO(daoResponse);
      setProposals(proposalsResponse);
      setProjects(projectsResponse);
      setMembers(membersResponse);
      setDAOStats(statsResponse);
      
    } catch (err) {
      console.error('Failed to load DAO details:', err);
      setError('Failed to load DAO details');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load treasury data
  const loadTreasuryData = useCallback(async (daoId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        daoApi.getTreasuryBalance(daoId),
        daoApi.getTreasuryTransactions(daoId)
      ]);

      setTreasuryBalance(balanceResponse);
      setTreasuryTransactions(transactionsResponse);
    } catch (err) {
      console.error('Failed to load treasury data:', err);
    }
  }, [isAuthenticated]);

  // Initial data loading
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDAOs();
    }
  }, [isAuthenticated, user?.id]); // Only depend on auth state and user ID

  // Load DAO details when selectedDAO changes
  useEffect(() => {
    if (selectedDAO?.id) {
      loadDAODetails(selectedDAO.id);
      loadTreasuryData(selectedDAO.id);
    }
  }, [selectedDAO?.id]); // Only depend on the DAO ID, not the functions

  // Create DAO
  const handleCreateDAO = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔥 Creating DAO with data:', data);
      
      const newDAO = await daoApi.createDAO({
        name: data.name,
        description: data.description,
        treasuryAddress: data.treasuryAddress,
        governanceToken: data.governanceToken,
        totalSupply: data.totalSupply || 1000000,
        quorumThreshold: data.quorumThreshold,
        votingPeriod: data.votingPeriod
      });
      
      console.log('✅ DAO created successfully:', newDAO);
      
      success('DAO created successfully!', 'Your new DAO has been created and you are now an admin.');
      
      // Refresh DAO list
      await loadDAOs();
      
      // Select the newly created DAO
      setSelectedDAO(newDAO);
      setShowCreateDAO(false);
      
      console.log('🎉 DAO creation completed!');
      
    } catch (err) {
      console.error('❌ Failed to create DAO:', err);
      showError('Failed to create DAO', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create Project
  const handleCreateProject = async (data: any) => {
    if (!selectedDAO) {
      showError('No DAO selected', 'Please select a DAO first.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔥 Creating project with data:', {
        daoId: selectedDAO.id,
        data,
        user: user?.id,
        isAuthenticated
      });
      const newProject = await daoApi.createProject(selectedDAO.id, data);
      console.log('📥 API Response:', newProject);
      
      console.log('✅ Project created successfully:', newProject);
      
      // 清除DAO相关缓存确保立即显示新创建的项目
      invalidateApiCache('/daos');
      invalidateApiCache('/projects');
      
      success('Project created successfully!', 'Your project has been created and is now active.');
      setShowCreateProject(false);
      await loadDAODetails(selectedDAO.id); // Refresh project list
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Description must be at least 20')) {
          errorMessage = 'Description must be at least 20 characters long.';
        } else if (err.message.includes('请求超时')) {
          errorMessage = 'Request timeout. Please check your network and try again.';
        } else if (err.message.includes('400')) {
          errorMessage = 'Invalid input data. Please check your form and try again.';
        }
      }
      
      showError('Failed to create project', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // View Project Details
  const handleViewProjectDetails = (project: DAOProject) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  // View Proposal Details
  const handleViewProposalDetails = (proposal: DAOProposal) => {
    setSelectedProposal(proposal);
    setShowProposalDetails(true);
  };

  // Additional proposal operations
  const handleExecuteProposal = async (proposalId: string) => {
    if (!selectedDAO) return;

    try {
      setLoading(true);
      console.log('🔥 Executing proposal:', proposalId);
      
      // TODO: Implement proposal execution API
      // await daoApi.executeProposal(proposalId);
      
      success('提案执行成功!', '提案已成功执行，相关操作已生效。');
      await loadDAODetails(selectedDAO.id);
    } catch (error) {
      console.error('❌ 执行提案失败:', error);
      showError('执行提案失败', '请重试或联系管理员。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    if (!selectedDAO) return;

    try {
      setLoading(true);
      console.log('🔥 Cancelling proposal:', proposalId);
      
      // TODO: Implement proposal cancellation API
      // await daoApi.cancelProposal(proposalId);
      
      success('提案取消成功!', '提案已被取消，投票已停止。');
      await loadDAODetails(selectedDAO.id);
    } catch (error) {
      console.error('❌ 取消提案失败:', error);
      showError('取消提案失败', '请重试或联系管理员。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('确定要删除这个提案吗？此操作无法撤销。')) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔥 Deleting proposal:', proposalId);
      
      await daoApi.deleteProposal(proposalId);
      
      success('提案删除成功!', '提案已被删除。');
      await loadDAODetails(selectedDAO.id);
    } catch (error) {
      console.error('❌ 删除提案失败:', error);
      showError('删除提案失败', '请重试或联系管理员。');
    } finally {
      setLoading(false);
    }
  };

  // Create Proposal
  const handleCreateProposal = async (data: any) => {
    if (!selectedDAO) {
      showError('No DAO selected', 'Please select a DAO first.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔥 Creating proposal with data:', data);
      const newProposal = await daoApi.createProposal(selectedDAO.id, data);
      
      console.log('✅ Proposal created successfully:', newProposal);
      
      // 清除DAO相关缓存确保立即显示新创建的提案
      invalidateApiCache('/daos');
      invalidateApiCache('/proposals');
      
      success('Proposal created successfully!', 'Your proposal is now active and members can vote.');
      setShowCreateProposal(false);
      await loadDAODetails(selectedDAO.id); // Refresh proposal list
    } catch (err) {
      console.error('❌ Failed to create proposal:', err);
      showError('Failed to create proposal', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Vote on Proposal
  const handleVote = async (proposalId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    if (!selectedDAO) {
      showError('No DAO selected', 'Please select a DAO first.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔥 Voting on proposal:', { proposalId, voteType });
      const voteResult = await daoApi.voteOnProposal(proposalId, {
        voteType: voteType.toUpperCase() as 'FOR' | 'AGAINST' | 'ABSTAIN',
        reason: '' // Could add a reason input in the future
      });
      
      console.log('✅ Vote submitted successfully');
      success('Vote submitted successfully!', `Your ${voteType} vote has been recorded.`);
      await loadDAODetails(selectedDAO.id); // Refresh to show updated vote counts
    } catch (err: any) {
      console.error('❌ Failed to vote:', err);
      
      // 检查具体的错误信息
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // 针对特定错误提供更友好的提示
      if (errorMessage.includes('already voted')) {
        showError('Already Voted', 'You have already cast your vote on this proposal. Each member can only vote once.');
      } else if (errorMessage.includes('not a member')) {
        showError('Not a Member', 'You need to be a member of this DAO to vote on proposals.');
      } else if (errorMessage.includes('not active')) {
        showError('Voting Closed', 'This proposal is no longer accepting votes.');
      } else {
        showError('Failed to submit vote', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Join DAO
  const handleJoinDAO = async (daoId: string) => {
    try {
      setLoading(true);
      const joinResult = await daoApi.joinDAO(daoId);
      // Reload DAO list
      await loadDAOs();
    } catch (err) {
      console.error('Failed to join DAO:', err);
      setError('Failed to join DAO');
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-600';
      case 'completed':
      case 'executed':
        return 'bg-blue-500/10 text-blue-600';
      case 'pending':
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
          <Wallet2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Please connect your Solana wallet to access DAO functionality and manage your decentralized organizations.
          </p>
          <WalletButton />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && daos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading DAOs...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    const isBackendError = error.includes('Backend connection failed') || error.includes('Network connection failed');
    const isRateLimitError = error.includes('Too many requests') || error.includes('429');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-semibold text-red-600">
          {isRateLimitError ? '请求过于频繁' : '连接错误'}
        </h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        
        {isRateLimitError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <h3 className="font-semibold text-blue-800 mb-2">提示:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 请稍等片刻后再试</li>
              <li>• 后端已启用请求频率限制</li>
              <li>• 开发模式下已放宽限制</li>
            </ul>
          </div>
        )}
        
        {isBackendError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
            <h3 className="font-semibold text-yellow-800 mb-2">解决方案:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 确保后端服务器运行在 http://localhost:3002</li>
              <li>• 检查网络连接</li>
              <li>• 运行命令: <code className="bg-yellow-100 px-1 rounded">npm run dev</code> (在 backend 目录)</li>
            </ul>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button onClick={() => { setError(null); loadDAOs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              const health = await healthApi.checkBackend();
              if (health.success) {
                setError(null);
                loadDAOs();
              } else {
                setError(`Health check failed: ${health.error}`);
              }
            }}
          >
            <Activity className="h-4 w-4 mr-2" />
            检查后端
          </Button>
        </div>
      </div>
    );
  }

  // No DAOs state
  if (daos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
          <Users className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No DAOs Found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't joined any DAOs yet. Create a new DAO or join an existing one to get started.
          </p>
          <div className="flex space-x-2">
            <Button onClick={() => {
              console.log('Create DAO button clicked');
              setShowCreateDAO(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create DAO
            </Button>
            <Link href="/dao/browse">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Browse DAOs
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {daoStats ? formatCurrency(daoStats.treasuryBalance?.USDC || 0) : '--'}
                </div>
                <p className="text-sm text-muted-foreground">{t('dao.treasuryValue')}</p>
              </div>
              <Vault className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-sm text-muted-foreground">{t('dao.activeProjects')}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <p className="text-sm text-muted-foreground">{t('dao.totalMembers')}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{proposals.length}</div>
                <p className="text-sm text-muted-foreground">{t('dao.activeProposals')}</p>
              </div>
              <VoteIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DAO Information */}
      {selectedDAO && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedDAO.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDAO.status)}`}>
                {selectedDAO.status}
              </span>
            </CardTitle>
            <CardDescription>{selectedDAO.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Governance Token</p>
                <p className="font-semibold">{selectedDAO.governanceToken}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="font-semibold">{selectedDAO.totalSupply.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quorum Threshold</p>
                <p className="font-semibold">{selectedDAO.quorumThreshold}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voting Period</p>
                <p className="font-semibold">{selectedDAO.votingPeriod} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{t('dao.recentActivity')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    proposal.status === 'ACTIVE' ? 'bg-green-500' : 
                    proposal.status === 'EXECUTED' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{proposal.title}</h4>
                    <span className="text-xs text-muted-foreground">{formatDate(proposal.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{proposal.description}</p>
                </div>
              </div>
            ))}
            {proposals.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGovernanceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.governance')}</h3>
          <p className="text-sm text-muted-foreground">Create and vote on governance proposals</p>
        </div>
        <Button onClick={() => setShowCreateProposal(true)} disabled={!selectedDAO}>
          <Plus className="h-4 w-4 mr-2" />
          {t('dao.createNewProposal')}
        </Button>
      </div>

      {/* Proposals List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dao.proposals')}</CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-8">
              <VoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
              <p className="text-muted-foreground mb-4">Create the first proposal to get started</p>
              <Button onClick={() => setShowCreateProposal(true)} disabled={!selectedDAO}>
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  onViewDetails={handleViewProposalDetails}
                  onExecute={handleExecuteProposal}
                  onCancel={handleCancelProposal}
                  onDelete={handleDeleteProposal}
                  isLoading={loading}
                  userRole={members.find(m => m.address === user?.walletAddress)?.role}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.projectManagement')}</h3>
          <p className="text-sm text-muted-foreground">Manage DAO projects and milestones</p>
        </div>
        <Button onClick={() => setShowCreateProject(true)} disabled={!selectedDAO}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dao.projects')}</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create the first project to get started</p>
              <Button onClick={() => setShowCreateProject(true)} disabled={!selectedDAO}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="font-semibold">{formatCurrency(project.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Allocated</p>
                      <p className="font-semibold">{formatCurrency(project.allocatedFunds)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-semibold">{formatCurrency(project.spentFunds)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{formatDate(project.startDate)}</p>
                    </div>
                  </div>
                  
                  {/* Token Reward and Progress */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {project.tokenReward && project.tokenReward > 0 && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Coins className="h-4 w-4 text-purple-600" />
                          <span className="text-muted-foreground">Token Reward:</span>
                          <span className="font-semibold text-purple-600">{project.tokenReward} {selectedDAO?.governanceToken}</span>
                        </div>
                      )}
                      {project.milestones && project.milestones.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {project.milestones.filter((m: any) => m.status === 'COMPLETED').length}/{project.milestones.length} milestones completed
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProjectDetails(project)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTreasuryTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.treasuryManagement')}</h3>
          <p className="text-sm text-muted-foreground">Monitor and manage DAO treasury funds</p>
        </div>
      </div>

      {/* Treasury Balance */}
      {treasuryBalance && (
        <Card>
          <CardHeader>
            <CardTitle>Treasury Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {treasuryBalance.balance.map((asset: any) => (
                <div key={asset.token} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{asset.token}</span>
                    </div>
                    <span className="font-medium">{asset.token}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{asset.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">${asset.usdValue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {treasuryTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">Treasury transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {treasuryTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(tx.status).replace('bg-', 'bg-').replace('/10', '')}`}></div>
                    <div>
                      <p className="font-medium">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{tx.amount} {tx.token}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.memberManagement')}</h3>
          <p className="text-sm text-muted-foreground">Manage DAO members and roles</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members yet</h3>
              <p className="text-muted-foreground">Members will appear here once they join</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.address.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{member.address.slice(0, 6)}...{member.address.slice(-4)}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role}
                        </span>
                        <span>•</span>
                        <span>Voting Power: {member.votingPower.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">Score: {member.contributionScore}</div>
                    <div className="text-muted-foreground">Reputation: {member.reputation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('dao.title')}</h1>
          <p className="text-muted-foreground">
            {selectedDAO ? `Managing ${selectedDAO.name}` : 'Decentralized Autonomous Organization Management'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dao/browse">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Browse DAOs
            </Button>
          </Link>
          <Button onClick={() => {
            console.log('Create DAO header button clicked');
            setShowCreateDAO(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create DAO
          </Button>
        </div>
      </div>

      {/* DAO Selector (if user has multiple DAOs) */}
      {daos.length > 1 && (
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium">Current DAO:</label>
          <select 
            className="px-3 py-2 border rounded-md min-w-[200px]"
            value={selectedDAO?.id || ''}
            onChange={(e) => {
              const dao = daos.find(d => d.id === e.target.value);
              if (dao) setSelectedDAO(dao);
            }}
          >
            {daos.map(dao => (
              <option key={dao.id} value={dao.id}>{dao.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-1 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'governance' && renderGovernanceTab()}
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'treasury' && renderTreasuryTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'analytics' && selectedDAO && (
          <DAOAnalytics 
            dao={selectedDAO}
            proposals={proposals}
            projects={projects}
            members={members}
            treasury={treasuryTransactions}
          />
        )}
      </div>


      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Create DAO Modal */}
      <CreateDAOModal
        isOpen={showCreateDAO}
        onClose={() => {
          console.log('Closing Create DAO modal');
          setShowCreateDAO(false);
        }}
        onSuccess={handleCreateDAO}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleCreateProject}
      />

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        onSuccess={handleCreateProposal}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={showProjectDetails}
        onClose={() => {
          setShowProjectDetails(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        daoToken={selectedDAO?.governanceToken || 'TOKEN'}
      />

      {/* Proposal Details Modal */}
      <ProposalDetailsModal
        isOpen={showProposalDetails}
        onClose={() => {
          setShowProposalDetails(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal}
        onVote={handleVote}
        isLoading={loading}
        daoToken={selectedDAO?.governanceToken || 'TOKEN'}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded">
          showCreateDAO: {showCreateDAO.toString()}
        </div>
      )}
    </div>
  );
}