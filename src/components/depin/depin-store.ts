"use client"

// DePIN Data Store and Management
export interface DePINProject {
  id: string;
  name: string;
  category: 'storage' | 'computing' | 'wireless' | 'sensors';
  description: string;
  nodes: string;
  capacity: string;
  rewards: string;
  apy: string;
  status: 'active' | 'inactive' | 'maintenance';
  blockchain: string;
  logo?: string;
  website?: string;
  tokenSymbol: string;
  tokenPrice: number;
  marketCap: string;
  volume24h: string;
  hardwareRequirement: HardwareSpec[];
  minInvestment: number;
  roiPeriod: number; // months
  geographicFocus: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface HardwareSpec {
  type: 'storage' | 'cpu' | 'gpu' | 'memory' | 'network' | 'sensor';
  requirement: string;
  cost: number; // USD
  powerConsumption: number; // Watts
}

export interface MyNode {
  id: string;
  network: string;
  nodeId: string;
  type: string;
  capacity: string;
  earnings: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  uptime: string;
  location: string;
  startDate: string;
  totalEarned: number;
  hardware: HardwareSpec[];
  performance: NodePerformance;
}

export interface NodePerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  bandwidthUp: number;
  bandwidthDown: number;
}

export interface ROICalculation {
  projectId: string;
  location: string;
  hardwareCost: number;
  monthlyCost: number; // electricity + internet
  estimatedMonthlyReward: number;
  roiMonths: number;
  annualROI: number;
  riskFactors: string[];
}

// Default DePIN Projects Data with Solana ecosystem focus
export const DEFAULT_DEPIN_PROJECTS: DePINProject[] = [
  {
    id: 'filecoin',
    name: 'Filecoin',
    category: 'storage',
    description: 'Decentralized storage network with proof-of-spacetime consensus',
    nodes: '15,432',
    capacity: '18.5 EiB',
    rewards: '$1.2M/day',
    apy: '12.5%',
    status: 'active',
    blockchain: 'Filecoin',
    tokenSymbol: 'FIL',
    tokenPrice: 4.23,
    marketCap: '$2.1B',
    volume24h: '$89M',
    hardwareRequirement: [
      { type: 'storage', requirement: '32-128 TiB SSD', cost: 5000, powerConsumption: 300 },
      { type: 'cpu', requirement: '8-core 2.8GHz+', cost: 800, powerConsumption: 95 },
      { type: 'memory', requirement: '128-256 GB RAM', cost: 1200, powerConsumption: 50 }
    ],
    minInvestment: 7000,
    roiPeriod: 18,
    geographicFocus: ['Global'],
    riskLevel: 'medium'
  },
  {
    id: 'helium',
    name: 'Helium',
    category: 'wireless',
    description: 'Decentralized wireless network for IoT devices, migrated to Solana',
    nodes: '47,891',
    capacity: 'Global IoT Coverage',
    rewards: '$890K/day',
    apy: '8.3%',
    status: 'active',
    blockchain: 'Solana',
    tokenSymbol: 'HNT',
    tokenPrice: 2.45,
    marketCap: '$450M',
    volume24h: '$24M',
    hardwareRequirement: [
      { type: 'network', requirement: 'Helium Hotspot', cost: 500, powerConsumption: 5 },
      { type: 'network', requirement: 'Internet Connection', cost: 50, powerConsumption: 10 }
    ],
    minInvestment: 600,
    roiPeriod: 12,
    geographicFocus: ['North America', 'Europe', 'Asia'],
    riskLevel: 'low'
  },
  {
    id: 'render',
    name: 'Render Network',
    category: 'computing',
    description: 'Distributed GPU rendering network for 3D graphics and AI workloads',
    nodes: '8,234',
    capacity: '2.1M GPU Hours',
    rewards: '$650K/day',
    apy: '15.2%',
    status: 'active',
    blockchain: 'Ethereum',
    tokenSymbol: 'RNDR',
    tokenPrice: 7.89,
    marketCap: '$2.9B',
    volume24h: '$156M',
    hardwareRequirement: [
      { type: 'gpu', requirement: 'RTX 3070+, 8GB+ VRAM', cost: 1200, powerConsumption: 250 },
      { type: 'cpu', requirement: '6-core 3.0GHz+', cost: 400, powerConsumption: 65 },
      { type: 'memory', requirement: '32 GB RAM', cost: 300, powerConsumption: 20 }
    ],
    minInvestment: 2000,
    roiPeriod: 14,
    geographicFocus: ['Global'],
    riskLevel: 'medium'
  },
  {
    id: 'hivemapper',
    name: 'Hivemapper',
    category: 'sensors',
    description: 'Decentralized mapping network with dash cams, built on Solana',
    nodes: '12,567',
    capacity: '2.1M km mapped',
    rewards: '$320K/day',
    apy: '22.5%',
    status: 'active',
    blockchain: 'Solana',
    tokenSymbol: 'HONEY',
    tokenPrice: 0.045,
    marketCap: '$45M',
    volume24h: '$2.1M',
    hardwareRequirement: [
      { type: 'sensor', requirement: 'Hivemapper Dash Cam', cost: 549, powerConsumption: 12 },
      { type: 'network', requirement: 'Mobile Data Plan', cost: 30, powerConsumption: 5 }
    ],
    minInvestment: 600,
    roiPeriod: 8,
    geographicFocus: ['North America'],
    riskLevel: 'high'
  },
  {
    id: 'akash',
    name: 'Akash Network',
    category: 'computing',
    description: 'Decentralized cloud computing marketplace with Kubernetes support',
    nodes: '6,891',
    capacity: '1.2M CPU hours',
    rewards: '$180K/day',
    apy: '18.7%',
    status: 'active',
    blockchain: 'Cosmos',
    tokenSymbol: 'AKT',
    tokenPrice: 3.21,
    marketCap: '$278M',
    volume24h: '$8.9M',
    hardwareRequirement: [
      { type: 'cpu', requirement: '8-core CPU', cost: 600, powerConsumption: 95 },
      { type: 'memory', requirement: '64 GB RAM', cost: 400, powerConsumption: 30 },
      { type: 'storage', requirement: '1 TB NVMe SSD', cost: 200, powerConsumption: 8 }
    ],
    minInvestment: 1300,
    roiPeriod: 16,
    geographicFocus: ['Global'],
    riskLevel: 'medium'
  },
  {
    id: 'dimo',
    name: 'DIMO',
    category: 'sensors',
    description: 'Vehicle data network connecting cars to web3, with Solana integration',
    nodes: '8,234',
    capacity: '150K vehicles',
    rewards: '$95K/day',
    apy: '16.8%',
    status: 'active',
    blockchain: 'Polygon',
    tokenSymbol: 'DIMO',
    tokenPrice: 0.18,
    marketCap: '$45M',
    volume24h: '$1.2M',
    hardwareRequirement: [
      { type: 'sensor', requirement: 'AutoPi Device', cost: 350, powerConsumption: 2 },
      { type: 'network', requirement: 'Mobile Data Plan', cost: 20, powerConsumption: 3 }
    ],
    minInvestment: 400,
    roiPeriod: 10,
    geographicFocus: ['Global'],
    riskLevel: 'medium'
  }
];

export const DEFAULT_MY_NODES: MyNode[] = [
  {
    id: 'node-fil-001',
    network: 'Filecoin',
    nodeId: 'f01234567',
    type: 'Storage Miner',
    capacity: '64 TiB',
    earnings: '$45.32/day',
    status: 'online',
    uptime: '99.2%',
    location: 'San Francisco, CA',
    startDate: '2024-03-15',
    totalEarned: 2847.50,
    hardware: [
      { type: 'storage', requirement: '64 TiB', cost: 8000, powerConsumption: 300 },
      { type: 'cpu', requirement: 'AMD EPYC 7302', cost: 1200, powerConsumption: 155 }
    ],
    performance: {
      cpuUsage: 45,
      memoryUsage: 78,
      diskUsage: 89,
      networkLatency: 23,
      bandwidthUp: 45,
      bandwidthDown: 120
    }
  },
  {
    id: 'node-hnt-001',
    network: 'Helium',
    nodeId: 'hotspot-abc123',
    type: 'IoT Hotspot',
    capacity: 'RF Coverage',
    earnings: '$8.90/day',
    status: 'online',
    uptime: '98.7%',
    location: 'Austin, TX',
    startDate: '2024-01-20',
    totalEarned: 578.90,
    hardware: [
      { type: 'network', requirement: 'RAK Hotspot V2', cost: 500, powerConsumption: 5 }
    ],
    performance: {
      cpuUsage: 12,
      memoryUsage: 34,
      diskUsage: 45,
      networkLatency: 45,
      bandwidthUp: 12,
      bandwidthDown: 25
    }
  }
];

// DePIN Store class for state management
export class DePINStore {
  private projects: DePINProject[] = [];
  private myNodes: MyNode[] = [];
  private isInitialized = false;

  constructor() {
    this.loadData();
  }

  private loadData() {
    if (typeof window === 'undefined') return;
    
    try {
      const storedProjects = localStorage.getItem('depin-projects');
      const storedNodes = localStorage.getItem('depin-nodes');
      
      this.projects = storedProjects ? JSON.parse(storedProjects) : DEFAULT_DEPIN_PROJECTS;
      this.myNodes = storedNodes ? JSON.parse(storedNodes) : DEFAULT_MY_NODES;
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading DePIN data:', error);
      this.projects = DEFAULT_DEPIN_PROJECTS;
      this.myNodes = DEFAULT_MY_NODES;
    }
  }

  private saveData() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('depin-projects', JSON.stringify(this.projects));
      localStorage.setItem('depin-nodes', JSON.stringify(this.myNodes));
    } catch (error) {
      console.error('Error saving DePIN data:', error);
    }
  }

  getProjects(): DePINProject[] {
    return this.projects;
  }

  getProject(id: string): DePINProject | undefined {
    return this.projects.find(p => p.id === id);
  }

  addProject(projectData: Omit<DePINProject, 'id'>): DePINProject {
    const newProject: DePINProject = {
      ...projectData,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.projects.unshift(newProject); // Add to beginning
    this.saveData();
    return newProject;
  }

  removeProject(projectId: string): boolean {
    const index = this.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      this.projects.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  getMyNodes(): MyNode[] {
    return this.myNodes;
  }

  addNode(nodeData: Omit<MyNode, 'id'>): MyNode {
    const newNode: MyNode = {
      ...nodeData,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.myNodes.unshift(newNode); // Add to beginning
    this.saveData();
    return newNode;
  }

  removeNode(nodeId: string): boolean {
    const index = this.myNodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      this.myNodes.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  getNode(id: string): MyNode | undefined {
    return this.myNodes.find(n => n.id === id);
  }

  addNode(node: MyNode): void {
    this.myNodes.push(node);
    this.saveData();
  }

  updateNode(id: string, updates: Partial<MyNode>): void {
    const index = this.myNodes.findIndex(n => n.id === id);
    if (index !== -1) {
      this.myNodes[index] = { ...this.myNodes[index], ...updates };
      this.saveData();
    }
  }

  removeNode(id: string): void {
    this.myNodes = this.myNodes.filter(n => n.id !== id);
    this.saveData();
  }

  calculateROI(projectId: string, location: string, customCost?: number): ROICalculation {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hardwareCost = customCost || project.hardwareRequirement.reduce((sum, hw) => sum + hw.cost, 0);
    const monthlyCost = 150; // Estimated electricity + internet
    const baseMonthlyReward = (parseFloat(project.apy.replace('%', '')) / 100) * hardwareCost / 12;
    
    // Apply location modifier (simplified)
    const locationModifier = this.getLocationModifier(location, project.category);
    const estimatedMonthlyReward = baseMonthlyReward * locationModifier;
    
    const roiMonths = hardwareCost / (estimatedMonthlyReward - monthlyCost);
    const annualROI = ((estimatedMonthlyReward * 12 - monthlyCost * 12) / hardwareCost) * 100;

    return {
      projectId,
      location,
      hardwareCost,
      monthlyCost,
      estimatedMonthlyReward,
      roiMonths,
      annualROI,
      riskFactors: this.getRiskFactors(project)
    };
  }

  private getLocationModifier(location: string, category: string): number {
    // Simplified location-based modifiers
    const modifiers: Record<string, Record<string, number>> = {
      'storage': {
        'San Francisco': 1.2,
        'New York': 1.1,
        'Austin': 1.0,
        'Denver': 0.9,
        'default': 1.0
      },
      'wireless': {
        'San Francisco': 1.3,
        'New York': 1.4,
        'Austin': 1.1,
        'Denver': 0.8,
        'default': 1.0
      },
      'computing': {
        'San Francisco': 1.1,
        'New York': 1.1,
        'Austin': 1.0,
        'Denver': 0.9,
        'default': 1.0
      },
      'sensors': {
        'San Francisco': 1.2,
        'New York': 1.3,
        'Austin': 1.0,
        'Denver': 0.7,
        'default': 1.0
      }
    };

    return modifiers[category]?.[location] || modifiers[category]?.default || 1.0;
  }

  private getRiskFactors(project: DePINProject): string[] {
    const factors: string[] = [];
    
    if (project.riskLevel === 'high') {
      factors.push('High market volatility', 'Early stage project');
    }
    if (project.blockchain !== 'Solana' && project.blockchain !== 'Ethereum') {
      factors.push('Less established blockchain');
    }
    if (project.minInvestment > 3000) {
      factors.push('High initial investment required');
    }
    if (project.roiPeriod > 18) {
      factors.push('Long payback period');
    }
    
    return factors;
  }

  // Simulate real-time data updates
  simulateRealtimeUpdate(): void {
    this.myNodes.forEach(node => {
      // Simulate small performance fluctuations
      node.performance = {
        ...node.performance,
        cpuUsage: Math.max(0, Math.min(100, node.performance.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, node.performance.memoryUsage + (Math.random() - 0.5) * 5)),
        networkLatency: Math.max(1, node.performance.networkLatency + (Math.random() - 0.5) * 20)
      };

      // Simulate earnings fluctuation
      const currentEarnings = parseFloat(node.earnings.replace('$', '').replace('/day', ''));
      const variation = (Math.random() - 0.5) * 0.1; // ±10% variation
      const newEarnings = currentEarnings * (1 + variation);
      node.earnings = `$${newEarnings.toFixed(2)}/day`;
    });

    this.saveData();
  }

  exportData(): string {
    return JSON.stringify({
      projects: this.projects,
      nodes: this.myNodes,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.projects && data.nodes) {
        this.projects = data.projects;
        this.myNodes = data.nodes;
        this.saveData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Global store instance
export const depinStore = new DePINStore();