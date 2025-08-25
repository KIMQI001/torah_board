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
  Coins, Percent, Wallet2, RefreshCw, Download
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";
import { daoStore, Proposal, Project, Member } from "@/components/dao/dao-store";
import type { Vote } from "@/components/dao/dao-store";
import { CreateProposalModal } from "@/components/dao/create-proposal-modal";
import { CreateProjectModal } from "@/components/dao/create-project-modal";
import { ConfirmationDialog } from "@/components/dao/confirmation-dialog";
import { ToastContainer, useToast } from "@/components/dao/toast";
import { SolanaWallet } from "@/components/dao/solana-wallet";

// Enhanced types for DAO management
type ProposalStatus = 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
type ProjectStatus = 'planning' | 'active' | 'milestone_pending' | 'completed' | 'cancelled';
type MemberRole = 'admin' | 'member' | 'contributor' | 'observer';
type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'reward' | 'fee' | 'milestone_payment';
type VoteType = 'for' | 'against' | 'abstain';
type DistributionMethod = 'token_holding' | 'contribution' | 'equal' | 'custom';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votingPower: {
    for: number;
    against: number;
    abstain: number;
    total: number;
  };
  quorum: number;
  threshold: number;
  startTime: Date;
  endTime: Date;
  executionTime?: Date;
  requestedAmount?: number;
  category: 'investment' | 'governance' | 'treasury' | 'membership';
  attachments?: string[];
  discussion?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  totalBudget: number;
  allocatedFunds: number;
  spentFunds: number;
  milestones: Milestone[];
  teamMembers: string[];
  startDate: Date;
  expectedEndDate: Date;
  category: string;
  roi: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  budget: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'paid';
  deliverables: string[];
  verificationRequirement: number; // percentage of voting power needed
}

interface Member {
  id: string;
  address: string;
  role: MemberRole;
  votingPower: number;
  reputation: number;
  joinDate: Date;
  lastActivity: Date;
  contributionScore: number;
  delegatedTo?: string;
  delegatedFrom: string[];
  proposalsCreated: number;
  votesParticipated: number;
}

interface TreasuryTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  token: string;
  from?: string;
  to?: string;
  description: string;
  timestamp: Date;
  proposalId?: string;
  projectId?: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface DistributionRule {
  id: string;
  name: string;
  method: DistributionMethod;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  isActive: boolean;
  totalDistributed: number;
  lastDistribution?: Date;
  nextDistribution: Date;
  eligibleMembers: number;
}

export default function DAOPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state for functionality
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'vote' | 'execute' | 'cancel';
    title?: string;
    message?: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'delete' });
  const [voteAction, setVoteAction] = useState<{
    proposalId: string;
    voteType: 'for' | 'against' | 'abstain';
  } | null>(null);
  
  const toast = useToast();

  // Load data on component mount
  useEffect(() => {
    setProposals(daoStore.getProposals());
    setProjects(daoStore.getProjects());
    setMembers(daoStore.getMembers());
  }, []);

  const tabs = [
    { id: 'overview', label: t('dao.overview'), icon: BarChart },
    { id: 'projects', label: t('dao.projects'), icon: Briefcase },
    { id: 'revenue', label: t('dao.revenueDistribution'), icon: Coins },
    { id: 'governance', label: t('dao.governance'), icon: VoteIcon },
    { id: 'treasury', label: t('dao.treasury'), icon: Vault },
    { id: 'members', label: t('dao.members'), icon: Users },
    { id: 'analytics', label: t('dao.analytics'), icon: PieChart }
  ];

  // Data filtering and searching
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = !searchQuery || 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || proposal.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || 
      member.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Event handlers
  const handleCreateProposal = (proposal: Proposal) => {
    setProposals([...proposals, proposal]);
    toast.success(t('dao.proposalCreated'), t('dao.proposalCreatedDesc'));
  };

  const handleCreateProject = (project: Project) => {
    setProjects([...projects, project]);
    toast.success(t('dao.projectCreated'), t('dao.projectCreatedDesc'));
  };

  const handleVote = (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    setVoteAction({ proposalId, voteType });
    setConfirmDialog({
      isOpen: true,
      type: 'vote',
      title: `${t('dao.confirmVote')}: ${voteType.toUpperCase()}`,
      message: t('dao.voteWarning'),
      onConfirm: () => confirmVote(proposalId, voteType)
    });
  };

  const confirmVote = (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    const vote: Vote = {
      id: daoStore.generateId(),
      proposalId,
      voter: 'current-user-address',
      voteType,
      votingPower: 25000, // From mock wallet
      timestamp: new Date()
    };
    
    daoStore.addVote(vote);
    
    // Update proposal voting power
    const updatedProposals = proposals.map(proposal => {
      if (proposal.id === proposalId) {
        const newVotingPower = { ...proposal.votingPower };
        newVotingPower[voteType] += vote.votingPower;
        newVotingPower.total += vote.votingPower;
        return { ...proposal, votingPower: newVotingPower };
      }
      return proposal;
    });
    
    setProposals(updatedProposals);
    daoStore.setProposals(updatedProposals);
    
    toast.success(t('dao.voteSubmitted'), `Your ${voteType} vote has been recorded`);
    setConfirmDialog({ isOpen: false, type: 'delete' });
  };

  const handleDeleteProposal = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: t('dao.deleteProposal'),
      message: t('common.deleteWarning'),
      onConfirm: () => {
        daoStore.deleteProposal(id);
        setProposals(proposals.filter(p => p.id !== id));
        toast.success(t('dao.proposalDeleted'));
        setConfirmDialog({ isOpen: false, type: 'delete' });
      }
    });
  };

  const handleDeleteProject = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: t('dao.deleteProject'),
      message: t('common.deleteWarning'),
      onConfirm: () => {
        daoStore.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
        toast.success(t('dao.projectDeleted'));
        setConfirmDialog({ isOpen: false, type: 'delete' });
      }
    });
  };

  const exportData = () => {
    try {
      const dataStr = daoStore.exportData();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `dao-data-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('dao.dataExported'));
    } catch (error) {
      toast.error(t('dao.exportError'));
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = daoStore.importData(content);
        if (success) {
          setProposals(daoStore.getProposals());
          setProjects(daoStore.getProjects());
          setMembers(daoStore.getMembers());
          toast.success(t('dao.dataImported'));
        } else {
          toast.error(t('dao.importError'));
        }
      } catch (error) {
        toast.error(t('dao.importError'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Enhanced mock data with dynamic data
  const mockProjects: Project[] = projects.length > 0 ? projects : [
    {
      id: 'proj-001',
      title: 'NFT Marketplace Development',
      description: 'Build a decentralized NFT marketplace with low fees and creator royalties',
      status: 'active',
      totalBudget: 750000,
      allocatedFunds: 300000,
      spentFunds: 150000,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expectedEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      category: 'Product Development',
      roi: 18.5,
      riskLevel: 'medium',
      teamMembers: ['0x1111', '0x2222', '0x3333'],
      milestones: [
        {
          id: 'ms-001',
          title: 'MVP Development',
          description: 'Core marketplace functionality',
          targetDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          completedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          budget: 150000,
          status: 'paid',
          deliverables: ['Smart contracts', 'Frontend interface', 'Testing suite'],
          verificationRequirement: 51
        },
        {
          id: 'ms-002',
          title: 'Security Audit & Beta Launch',
          description: 'Third-party audit and limited beta testing',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 100000,
          status: 'in_progress',
          deliverables: ['Audit report', 'Beta platform', 'User feedback analysis'],
          verificationRequirement: 51
        }
      ]
    },
    {
      id: 'proj-002',
      title: 'DeFi Yield Farming Protocol',
      description: 'Develop an innovative yield farming protocol with auto-compounding features',
      status: 'planning',
      totalBudget: 1200000,
      allocatedFunds: 0,
      spentFunds: 0,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      expectedEndDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
      category: 'DeFi',
      roi: 25.0,
      riskLevel: 'high',
      teamMembers: ['0x4444', '0x5555'],
      milestones: []
    }
  ];

  const mockProposals: Proposal[] = proposals.length > 0 ? proposals : [
    {
      id: 'prop-001',
      title: 'DeFi Protocol Investment - $500K',
      description: 'Proposal to invest in a new DeFi lending protocol with projected 15% APY',
      proposer: '0x1234...5678',
      status: 'active',
      votingPower: { for: 75000, against: 25000, abstain: 10000, total: 110000 },
      quorum: 100000,
      threshold: 60,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      requestedAmount: 500000,
      category: 'investment',
      discussion: 'https://forum.dao.org/proposal-001'
    }
  ];

  const mockMembers: Member[] = members.length > 0 ? members : [
    {
      id: 'member-001',
      address: '0x1234567890abcdef',
      role: 'admin',
      votingPower: 25000,
      reputation: 95,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      contributionScore: 88,
      delegatedFrom: ['0x5555', '0x6666'],
      proposalsCreated: 12,
      votesParticipated: 45
    }
  ];

  const mockDistributionRules: DistributionRule[] = [
    {
      id: 'dist-001',
      name: 'Monthly Token Holder Distribution',
      method: 'token_holding',
      frequency: 'monthly',
      isActive: true,
      totalDistributed: 125000,
      lastDistribution: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextDistribution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      eligibleMembers: 248
    }
  ];

  const mockTreasuryData = {
    totalValue: 2580000,
    availableFunds: 1850000,
    lockedFunds: 730000,
    monthlyIncome: 65000,
    monthlyExpenses: 38000,
    assets: [
      { symbol: 'USDC', amount: 1200000, percentage: 46.5 },
      { symbol: 'ETH', amount: 800000, percentage: 31.0 },
      { symbol: 'BTC', amount: 380000, percentage: 14.7 },
      { symbol: 'USDT', amount: 200000, percentage: 7.8 }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-500/10 text-green-600';
      case 'completed':
      case 'verified':
      case 'paid':
        return 'bg-blue-500/10 text-blue-600';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500/10 text-red-600';
      case 'paused':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/10 text-green-600';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'high':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (spent: number, total: number) => {
    return Math.round((spent / total) * 100);
  };

  // Tab content renderers
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(mockTreasuryData.totalValue)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.treasuryValue')}</p>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-sm font-medium">+12%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-sm text-muted-foreground">{t('dao.projects')}</p>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-sm font-medium">+{projects.filter(p => p.status === 'active').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{members.length + 245}</div>
                <p className="text-sm text-muted-foreground">{t('dao.totalMembers')}</p>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-sm font-medium">+{members.length}</div>
              </div>
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
              <div className="text-right">
                <div className="text-green-500 text-sm font-medium">+{proposals.filter(p => p.status === 'active').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{t('dao.milestoneComplete')}</h4>
                  <span className="text-xs text-muted-foreground">2 {t('dao.lastMonth')}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">NFT Marketplace MVP completed and verified by community</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-lg border">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{t('dao.newProposal')}</h4>
                  <span className="text-xs text-muted-foreground">5 {t('dao.lastMonth')}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">DeFi Protocol investment proposal created</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.projectManagement')}</h3>
          <p className="text-sm text-muted-foreground">{t('dao.projectsDesc')}</p>
        </div>
        <Button onClick={() => setShowCreateProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('dao.createProject')}
        </Button>
      </div>

      <div className="grid gap-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('dao.noActiveProjects')}</h3>
            <p className="text-muted-foreground mb-4">Create your first project to get started</p>
            <Button onClick={() => setShowCreateProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('dao.createProject')}
            </Button>
          </div>
        ) : filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{project.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {t(`dao.${project.status}`)}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {project.description}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedProject(project.id)}
                    title="View Project Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info('Edit Feature', 'Project editing will be available soon')}
                    title="Edit Project"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    title="Delete Project"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dao.projectBudget')}</p>
                  <p className="text-lg font-semibold">{formatCurrency(project.totalBudget)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dao.projectProgress')}</p>
                  <p className="text-lg font-semibold">{calculateProgress(project.spentFunds, project.totalBudget)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dao.projectROI')}</p>
                  <p className="text-lg font-semibold text-green-600">+{project.roi}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dao.projectRisk')}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(project.riskLevel)}`}>
                    {t(`dao.${project.riskLevel}`)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{t('dao.projectProgress')}</span>
                  <span>{formatCurrency(project.spentFunds)} / {formatCurrency(project.totalBudget)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${calculateProgress(project.spentFunds, project.totalBudget)}%` }}
                  ></div>
                </div>
              </div>

              {/* Milestones */}
              {project.milestones.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('dao.milestones')}</h4>
                  <div className="space-y-2">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            milestone.status === 'completed' ? 'bg-green-500' :
                            milestone.status === 'in_progress' ? 'bg-blue-500' : 
                            'bg-gray-300'
                          }`}></div>
                          <span className="text-sm">{milestone.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{formatCurrency(milestone.budget)}</span>
                          <span>•</span>
                          <span>{formatDate(milestone.targetDate)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                            {t(`dao.${milestone.status}`)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRevenueTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.revenueDistribution')}</h3>
          <p className="text-sm text-muted-foreground">Manage revenue distribution rules and track payment history</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          {t('dao.distributionSettings')}
        </Button>
      </div>

      {/* Distribution Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(mockDistributionRules[0].totalDistributed)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.totalDistributed')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{mockDistributionRules[0].eligibleMembers}</div>
                <p className="text-sm text-muted-foreground">{t('dao.participatingMembers')}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(15000)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.yourShare')}</p>
              </div>
              <Wallet2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatDate(mockDistributionRules[0].nextDistribution)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.nextDistribution')}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('dao.distributionRules')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDistributionRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{rule.name}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>{t(`dao.${rule.method.replace('_', '')}`)}</span>
                    <span>•</span>
                    <span>{rule.frequency}</span>
                    <span>•</span>
                    <span>{rule.eligibleMembers} {t('dao.members').toLowerCase()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(rule.totalDistributed)}</p>
                    <p className="text-sm text-muted-foreground">{t('dao.totalDistributed')}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>{t('dao.pendingRewards')}</span>
            </div>
            <Button
              onClick={() => toast.success('Rewards Claimed', 'You have successfully claimed $15,000 in rewards')}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('dao.claimRewards')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{formatCurrency(15000)} Available</h3>
            <p className="text-muted-foreground">Your rewards from the last distribution cycle</p>
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
        <Button onClick={() => setShowCreateProposal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('dao.createNewProposal')}
        </Button>
      </div>

      {/* Voting Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">45,000</div>
                <p className="text-sm text-muted-foreground">{t('dao.myVotingPower')}</p>
              </div>
              <VoteIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-sm text-muted-foreground">{t('dao.participationRate')}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">2.1d</div>
                <p className="text-sm text-muted-foreground">{t('dao.averageVotingTime')}</p>
              </div>
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Proposals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dao.activeProposals')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProposals.length === 0 ? (
            <div className="text-center py-8">
              <VoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('dao.noActiveProposals')}</h3>
              <p className="text-muted-foreground mb-4">{t('dao.noProposalsDesc')}</p>
              <Button onClick={() => setShowCreateProposal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('dao.createFirstProposal')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search and Filter for Proposals */}
              <div className="flex space-x-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="executed">Executed</option>
                </select>
              </div>

              {filteredProposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{proposal.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{proposal.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>{t('dao.proposer')}: {proposal.proposer}</span>
                      <span>•</span>
                      <span>{t('dao.timeLeft')}: {Math.ceil((proposal.endTime.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {t(`dao.${proposal.status}`)}
                  </span>
                </div>

                {/* Voting Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>{t('dao.forVotes')}: {proposal.votingPower.for.toLocaleString()}</span>
                    <span>{((proposal.votingPower.for / proposal.votingPower.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(proposal.votingPower.for / proposal.votingPower.total) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>{t('dao.againstVotes')}: {proposal.votingPower.against.toLocaleString()}</span>
                    <span>{((proposal.votingPower.against / proposal.votingPower.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(proposal.votingPower.against / proposal.votingPower.total) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVote(proposal.id, 'for')}
                    disabled={proposal.status !== 'active'}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {t('dao.support')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleVote(proposal.id, 'against')}
                    disabled={proposal.status !== 'active'}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {t('dao.against')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleVote(proposal.id, 'abstain')}
                    disabled={proposal.status !== 'active'}
                  >
                    {t('dao.abstain')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteProposal(proposal.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Proposal"
                  >
                    <Trash2 className="h-4 w-4" />
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
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => toast.info('Withdraw Feature', 'Treasury withdrawal will be available soon')}
          >
            <ArrowDownRight className="h-4 w-4 mr-2" />
            {t('dao.withdraw')}
          </Button>
          <Button
            onClick={() => toast.info('Deposit Feature', 'Treasury deposit will be available soon')}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            {t('dao.deposit')}
          </Button>
          <Button 
            variant="outline"
            onClick={exportData}
            title="Export DAO Data"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <span>
                <RefreshCw className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Treasury Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(mockTreasuryData.totalValue)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.portfolioValue')}</p>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-sm font-medium">+12.5%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(mockTreasuryData.availableFunds)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.availableBalance')}</p>
              </div>
              <Wallet2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(mockTreasuryData.lockedFunds)}</div>
                <p className="text-sm text-muted-foreground">{t('dao.lockedBalance')}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>{t('dao.assetAllocation')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTreasuryData.assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{asset.symbol}</span>
                  </div>
                  <span className="font-medium">{asset.symbol}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(asset.amount)}</div>
                    <div className="text-sm text-muted-foreground">{asset.percentage}%</div>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${asset.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('dao.monthlyFlow')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(mockTreasuryData.monthlyIncome)}</div>
              <p className="text-sm text-muted-foreground">{t('dao.income')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(mockTreasuryData.monthlyExpenses)}</div>
              <p className="text-sm text-muted-foreground">{t('dao.expenses')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('dao.memberManagement')}</h3>
          <p className="text-sm text-muted-foreground">Manage DAO members, roles, and permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('dao.inviteMembers')}
        </Button>
      </div>

      {/* Member Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">248</div>
                <p className="text-sm text-muted-foreground">{t('dao.totalMembers')}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">186</div>
                <p className="text-sm text-muted-foreground">{t('dao.activeMembers')}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">1.2M</div>
                <p className="text-sm text-muted-foreground">{t('dao.totalGovernanceTokens')}</p>
              </div>
              <Coins className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">87.5</div>
                <p className="text-sm text-muted-foreground">{t('dao.averageScore')}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dao.membersList')}</CardTitle>
          <div className="flex space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('dao.noMembers')}</h3>
                <p className="text-muted-foreground mb-4">{t('dao.noMembersDesc')}</p>
                <Button onClick={() => toast.info('Invite Feature', 'Member invitation will be available soon')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dao.inviteMembers')}
                </Button>
              </div>
            ) : (
              filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {member.address.substring(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{member.address}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'member' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`dao.${member.role}`)}
                      </span>
                      <span>•</span>
                      <span>{member.votingPower.toLocaleString()} {t('dao.votingPower')}</span>
                      <span>•</span>
                      <span>{t('dao.reputation')}: {member.reputation}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm">
                    <div className="font-medium">{member.contributionScore}</div>
                    <div className="text-muted-foreground">{t('dao.contributionScore')}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('dao.daoAnalytics')}</h3>
        <p className="text-sm text-muted-foreground">Comprehensive insights into DAO performance and activity</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">78%</div>
                <p className="text-sm text-muted-foreground">{t('dao.proposalSuccess')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">+34%</div>
                <p className="text-sm text-muted-foreground">{t('dao.treasuryGrowth')}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">89%</div>
                <p className="text-sm text-muted-foreground">{t('dao.participationRate')}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">2.1d</div>
                <p className="text-sm text-muted-foreground">{t('dao.averageVotingTime')}</p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>{t('dao.memberActivity')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Activity chart visualization will be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{t('dao.topContributors')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMembers.slice(0, 3).map((member, index) => (
              <div key={member.id} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  'bg-orange-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{member.address}</h4>
                  <p className="text-sm text-muted-foreground">{member.contributionScore} contribution points</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{member.proposalsCreated}</div>
                  <div className="text-sm text-muted-foreground">proposals</div>
                </div>
              </div>
            ))}
          </div>
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
            {t('dao.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <VoteIcon className="h-4 w-4 mr-2" />
            {t('dao.createProposal')}
          </Button>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            {t('dao.joinDAO')}
          </Button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
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
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'revenue' && renderRevenueTab()}
        {activeTab === 'governance' && renderGovernanceTab()}
        {activeTab === 'treasury' && renderTreasuryTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Add Solana Wallet component to Overview tab */}
      {activeTab === 'overview' && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solana Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <SolanaWallet />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateProposalModal 
        isOpen={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        onSuccess={handleCreateProposal}
      />

      <CreateProjectModal 
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleCreateProject}
      />

      <ConfirmationDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isLoading={loading}
      />

      {/* Toast Container */}
      <ToastContainer 
        toasts={toast.toasts}
        onRemove={toast.removeToast}
      />
    </div>
  );
}