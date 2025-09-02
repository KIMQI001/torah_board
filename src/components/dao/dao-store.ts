"use client"

// DAO Data Store with LocalStorage persistence
// This provides a centralized data management system for all DAO entities

// Re-export types from the main page for consistency
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
export type ProjectStatus = 'planning' | 'active' | 'milestone_pending' | 'completed' | 'cancelled';
export type MemberRole = 'admin' | 'member' | 'contributor' | 'observer';
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'reward' | 'fee' | 'milestone_payment';
export type VoteType = 'FOR' | 'AGAINST' | 'ABSTAIN';
export type DistributionMethod = 'token_holding' | 'contribution' | 'equal' | 'custom';

export interface Proposal {
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
  created: Date;
  createdBy: string;
}

export interface Project {
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
  created: Date;
  createdBy: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  budget: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'paid';
  deliverables: string[];
  verificationRequirement: number;
}

export interface Member {
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

export interface TreasuryTransaction {
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

export interface DistributionRule {
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

export interface Vote {
  id: string;
  proposalId: string;
  voter: string;
  voteType: VoteType;
  votingPower: number;
  timestamp: Date;
  reason?: string;
}

// Storage keys
const STORAGE_KEYS = {
  PROPOSALS: 'dao_proposals',
  PROJECTS: 'dao_projects', 
  MEMBERS: 'dao_members',
  TREASURY_TRANSACTIONS: 'dao_treasury_transactions',
  DISTRIBUTION_RULES: 'dao_distribution_rules',
  VOTES: 'dao_votes',
  TREASURY_DATA: 'dao_treasury_data'
} as const;

// DAO Store Class
class DAOStore {
  // Initialize with mock data if localStorage is empty
  private initializeDefaultData() {
    if (!this.getProposals().length) {
      this.setProposals([
        {
          id: 'prop-001',
          title: 'DeFi Protocol Investment - $500K',
          description: 'Proposal to invest in a new DeFi lending protocol with projected 15% APY. This investment will diversify our treasury and provide sustainable yield.',
          proposer: '0x1234...5678',
          status: 'active' as ProposalStatus,
          votingPower: { for: 75000, against: 25000, abstain: 10000, total: 110000 },
          quorum: 100000,
          threshold: 60,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          requestedAmount: 500000,
          category: 'investment',
          discussion: 'https://forum.dao.org/proposal-001',
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdBy: '0x1234...5678'
        },
        {
          id: 'prop-002',
          title: 'Treasury Diversification Strategy',
          description: 'Proposal to diversify 30% of our USDC holdings into BTC and ETH to hedge against stablecoin risk.',
          proposer: '0x5678...1234',
          status: 'draft' as ProposalStatus,
          votingPower: { for: 0, against: 0, abstain: 0, total: 0 },
          quorum: 80000,
          threshold: 55,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          requestedAmount: 800000,
          category: 'treasury',
          created: new Date(),
          createdBy: '0x5678...1234'
        }
      ]);
    }

    if (!this.getProjects().length) {
      this.setProjects([
        {
          id: 'proj-001',
          title: 'NFT Marketplace Development',
          description: 'Build a decentralized NFT marketplace with low fees and creator royalties on Solana',
          status: 'active' as ProjectStatus,
          totalBudget: 750000,
          allocatedFunds: 300000,
          spentFunds: 150000,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          category: 'Product Development',
          roi: 18.5,
          riskLevel: 'medium' as const,
          teamMembers: ['0x1111', '0x2222', '0x3333'],
          created: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
          createdBy: '0x1111',
          milestones: [
            {
              id: 'ms-001',
              title: 'MVP Development',
              description: 'Core marketplace functionality with SPL token support',
              targetDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              completedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
              budget: 150000,
              status: 'paid' as const,
              deliverables: ['Solana smart contracts', 'React frontend', 'Testing suite'],
              verificationRequirement: 51
            },
            {
              id: 'ms-002',
              title: 'Security Audit & Beta Launch',
              description: 'Third-party security audit and limited beta testing on devnet',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              budget: 100000,
              status: 'in_progress' as const,
              deliverables: ['Audit report', 'Beta platform', 'User feedback analysis'],
              verificationRequirement: 51
            }
          ]
        },
        {
          id: 'proj-002',
          title: 'DeFi Yield Farming Protocol',
          description: 'Develop an innovative yield farming protocol with auto-compounding features using Solana SPL tokens',
          status: 'planning' as ProjectStatus,
          totalBudget: 1200000,
          allocatedFunds: 0,
          spentFunds: 0,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
          category: 'DeFi',
          roi: 25.0,
          riskLevel: 'high' as const,
          teamMembers: ['0x4444', '0x5555'],
          created: new Date(),
          createdBy: '0x4444',
          milestones: []
        }
      ]);
    }

    if (!this.getMembers().length) {
      this.setMembers([
        {
          id: 'member-001',
          address: 'AbC123...defGhi789',
          role: 'admin' as MemberRole,
          votingPower: 25000,
          reputation: 95,
          joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          contributionScore: 88,
          delegatedFrom: ['0x5555', '0x6666'],
          proposalsCreated: 12,
          votesParticipated: 45
        },
        {
          id: 'member-002',
          address: 'SoL456...xyzAbc123',
          role: 'member' as MemberRole,
          votingPower: 15000,
          reputation: 82,
          joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          contributionScore: 76,
          delegatedFrom: [],
          proposalsCreated: 5,
          votesParticipated: 23
        },
        {
          id: 'member-003',
          address: 'DaO789...mnoPqr456',
          role: 'contributor' as MemberRole,
          votingPower: 8000,
          reputation: 78,
          joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
          contributionScore: 84,
          delegatedFrom: [],
          proposalsCreated: 3,
          votesParticipated: 18
        }
      ]);
    }
  }

  // Generic localStorage methods
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value, (key, val) => {
        if (val instanceof Date) return val.toISOString();
        return val;
      }));
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      return JSON.parse(item, (key, val) => {
        // Convert ISO date strings back to Date objects
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          return new Date(val);
        }
        return val;
      });
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return defaultValue;
    }
  }

  // Proposal methods
  getProposals(): Proposal[] {
    return this.getItem(STORAGE_KEYS.PROPOSALS, []);
  }

  setProposals(proposals: Proposal[]): void {
    this.setItem(STORAGE_KEYS.PROPOSALS, proposals);
  }

  addProposal(proposal: Proposal): void {
    const proposals = this.getProposals();
    proposals.push(proposal);
    this.setProposals(proposals);
  }

  updateProposal(id: string, updates: Partial<Proposal>): void {
    const proposals = this.getProposals();
    const index = proposals.findIndex(p => p.id === id);
    if (index !== -1) {
      proposals[index] = { ...proposals[index], ...updates };
      this.setProposals(proposals);
    }
  }

  deleteProposal(id: string): void {
    const proposals = this.getProposals();
    this.setProposals(proposals.filter(p => p.id !== id));
  }

  // Project methods
  getProjects(): Project[] {
    return this.getItem(STORAGE_KEYS.PROJECTS, []);
  }

  setProjects(projects: Project[]): void {
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  addProject(project: Project): void {
    const projects = this.getProjects();
    projects.push(project);
    this.setProjects(projects);
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      this.setProjects(projects);
    }
  }

  deleteProject(id: string): void {
    const projects = this.getProjects();
    this.setProjects(projects.filter(p => p.id !== id));
  }

  // Member methods
  getMembers(): Member[] {
    return this.getItem(STORAGE_KEYS.MEMBERS, []);
  }

  setMembers(members: Member[]): void {
    this.setItem(STORAGE_KEYS.MEMBERS, members);
  }

  addMember(member: Member): void {
    const members = this.getMembers();
    members.push(member);
    this.setMembers(members);
  }

  updateMember(id: string, updates: Partial<Member>): void {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      members[index] = { ...members[index], ...updates };
      this.setMembers(members);
    }
  }

  deleteMember(id: string): void {
    const members = this.getMembers();
    this.setMembers(members.filter(m => m.id !== id));
  }

  // Vote methods
  getVotes(): Vote[] {
    return this.getItem(STORAGE_KEYS.VOTES, []);
  }

  addVote(vote: Vote): void {
    const votes = this.getVotes();
    // Remove existing vote from same voter on same proposal
    const filteredVotes = votes.filter(v => !(v.proposalId === vote.proposalId && v.voter === vote.voter));
    filteredVotes.push(vote);
    this.setItem(STORAGE_KEYS.VOTES, filteredVotes);
  }

  getVotesForProposal(proposalId: string): Vote[] {
    return this.getVotes().filter(v => v.proposalId === proposalId);
  }

  // Treasury data methods
  getTreasuryData() {
    return this.getItem(STORAGE_KEYS.TREASURY_DATA, {
      totalValue: 2580000,
      availableFunds: 1850000,
      lockedFunds: 730000,
      monthlyIncome: 65000,
      monthlyExpenses: 38000,
      assets: [
        { symbol: 'USDC', amount: 1200000, percentage: 46.5 },
        { symbol: 'SOL', amount: 800000, percentage: 31.0 },
        { symbol: 'BTC', amount: 380000, percentage: 14.7 },
        { symbol: 'USDT', amount: 200000, percentage: 7.8 }
      ]
    });
  }

  // Distribution rules methods
  getDistributionRules(): DistributionRule[] {
    return this.getItem(STORAGE_KEYS.DISTRIBUTION_RULES, [
      {
        id: 'dist-001',
        name: 'Monthly Token Holder Distribution',
        method: 'token_holding' as DistributionMethod,
        frequency: 'monthly' as const,
        isActive: true,
        totalDistributed: 125000,
        lastDistribution: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextDistribution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        eligibleMembers: 248
      }
    ]);
  }

  // Utility methods
  generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportData(): string {
    const data = {
      proposals: this.getProposals(),
      projects: this.getProjects(),
      members: this.getMembers(),
      votes: this.getVotes(),
      treasuryData: this.getTreasuryData(),
      distributionRules: this.getDistributionRules(),
      exportedAt: new Date()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.proposals) this.setProposals(data.proposals);
      if (data.projects) this.setProjects(data.projects);
      if (data.members) this.setMembers(data.members);
      if (data.votes) this.setItem(STORAGE_KEYS.VOTES, data.votes);
      if (data.treasuryData) this.setItem(STORAGE_KEYS.TREASURY_DATA, data.treasuryData);
      if (data.distributionRules) this.setItem(STORAGE_KEYS.DISTRIBUTION_RULES, data.distributionRules);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Initialize data on first use
  initialize(): void {
    this.initializeDefaultData();
  }
}

// Export singleton instance
export const daoStore = new DAOStore();

// Initialize on module load
if (typeof window !== 'undefined') {
  daoStore.initialize();
}