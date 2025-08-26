const express = require('express');
const cors = require('cors');
const path = require('path');

// Add fetch support for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3007'],
  credentials: true
}));
app.use(express.json());

// Mock data for testing
const mockProjects = [
  {
    id: '1',
    name: 'Filecoin',
    category: 'storage',
    description: 'Decentralized storage network',
    nodes: '50000',
    capacity: '280.97 TiB',
    rewards: '$50/day',
    apy: '15.2%',
    status: 'active',
    blockchain: 'Filecoin',
    tokenSymbol: 'FIL',
    tokenPrice: 6.45,
    marketCap: '$3.2B',
    volume24h: '$85M',
    hardwareRequirement: 'Storage Server',
    minInvestment: 5000,
    roiPeriod: 18,
    geographicFocus: 'Global',
    riskLevel: 'medium',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Helium',
    category: 'wireless',
    description: 'Decentralized wireless infrastructure',
    nodes: '75000',
    capacity: '100 GB',
    rewards: '$25/day',
    apy: '22.5%',
    status: 'active',
    blockchain: 'Solana',
    tokenSymbol: 'HNT',
    tokenPrice: 4.2,
    marketCap: '$700M',
    volume24h: '$12M',
    hardwareRequirement: 'Helium Hotspot',
    minInvestment: 500,
    roiPeriod: 12,
    geographicFocus: 'Urban Areas',
    riskLevel: 'low',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Render Network',
    category: 'computing',
    description: 'Decentralized GPU rendering',
    nodes: '12000',
    capacity: '500 TFLOPS',
    rewards: '$120/day',
    apy: '35.8%',
    status: 'active',
    blockchain: 'Ethereum',
    tokenSymbol: 'RNDR',
    tokenPrice: 8.95,
    marketCap: '$3.4B',
    volume24h: '$45M',
    hardwareRequirement: 'High-end GPU',
    minInvestment: 2000,
    roiPeriod: 8,
    geographicFocus: 'Global',
    riskLevel: 'high',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Hivemapper',
    category: 'sensors',
    description: 'Decentralized mapping network',
    nodes: '5000',
    capacity: '10 TB',
    rewards: '$30/day',
    apy: '18.3%',
    status: 'active',
    blockchain: 'Solana',
    tokenSymbol: 'HONEY',
    tokenPrice: 0.085,
    marketCap: '$85M',
    volume24h: '$2.5M',
    hardwareRequirement: 'Dashcam Device',
    minInvestment: 300,
    roiPeriod: 15,
    geographicFocus: 'North America',
    riskLevel: 'medium',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

let mockNodes = [
  {
    id: '1',
    network: 'Filecoin',
    nodeId: 'f0101020',
    type: 'Storage',
    capacity: '280.97 TiB',
    earnings: '50.25 FIL/day',
    status: 'online',
    uptime: '99.2%',
    location: 'San Francisco, CA',
    startDate: '2024-01-15',
    totalEarned: 1250.75,
    hardware: [
      {
        type: 'Storage Server',
        requirement: '32TB NAS',
        cost: 5000,
        powerConsumption: 200
      }
    ],
    project: {
      id: '1',
      name: 'Filecoin',
      category: 'storage',
      blockchain: 'Filecoin'
    },
    performance: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      diskUsage: 82.1,
      networkLatency: 15,
      bandwidthUp: 100,
      bandwidthDown: 500,
      timestamp: '2024-01-20T10:30:00Z'
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    network: 'Helium',
    nodeId: 'brave-amber-cobra',
    type: 'Hotspot',
    capacity: '100 GB',
    earnings: '24.80 HNT/day',
    status: 'online',
    uptime: '98.7%',
    location: 'Austin, TX',
    startDate: '2024-02-01',
    totalEarned: 495.00,
    hardware: [
      {
        type: 'Helium Hotspot',
        requirement: 'Indoor Hotspot',
        cost: 500,
        powerConsumption: 5
      }
    ],
    monitorUrl: 'https://explorer.helium.com/hotspots/brave-amber-cobra',
    project: {
      id: '2',
      name: 'Helium',
      category: 'wireless',
      blockchain: 'Solana'
    },
    performance: {
      cpuUsage: 12.5,
      memoryUsage: 35.2,
      diskUsage: 25.8,
      networkLatency: 8,
      bandwidthUp: 50,
      bandwidthDown: 25,
      timestamp: '2024-02-10T15:45:00Z'
    },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-10T15:45:00Z'
  }
];

let users = {};
let currentUser = null;

// Mock Authentication Routes
app.post('/api/v1/auth/message', (req, res) => {
  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
  }

  const message = `Sign this message to authenticate with DePIN Dashboard:\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}\nNonce: ${Math.random().toString(36).substring(2)}`;
  
  res.json({
    success: true,
    data: {
      message,
      walletAddress
    }
  });
});

app.post('/api/v1/auth/authenticate', (req, res) => {
  const { walletAddress, publicKey, signature, message } = req.body;
  
  if (!walletAddress || !publicKey || !signature || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required authentication parameters'
    });
  }

  // Mock authentication - in development, always succeed
  const user = {
    id: `user_${walletAddress.substring(0, 8)}`,
    walletAddress,
    publicKey,
    balance: 125.75,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users[walletAddress] = user;
  currentUser = user;

  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  res.json({
    success: true,
    data: {
      token,
      user
    }
  });
});

app.get('/api/v1/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    });
  }

  // In development, return a mock user for any valid token
  const mockUser = currentUser || {
    id: 'user_mock',
    walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    publicKey: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    balance: 125.75,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  res.json({
    success: true,
    data: {
      user: mockUser
    }
  });
});

// Projects Routes
app.get('/api/v1/projects', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  
  let filteredProjects = mockProjects;
  
  if (category) {
    filteredProjects = mockProjects.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({
    success: true,
    data: filteredProjects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProjects.length,
      totalPages: Math.ceil(filteredProjects.length / limit)
    }
  });
});

app.get('/api/v1/projects/:id', (req, res) => {
  const { id } = req.params;
  const project = mockProjects.find(p => p.id === id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.json({
    success: true,
    data: project
  });
});

// Nodes Routes
app.get('/api/v1/nodes', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // In development, accept any valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { status, projectId, page = 1, limit = 20 } = req.query;
  
  let filteredNodes = mockNodes;
  
  if (status) {
    filteredNodes = filteredNodes.filter(n => n.status === status);
  }
  
  if (projectId) {
    filteredNodes = filteredNodes.filter(n => n.project.id === projectId);
  }

  res.json({
    success: true,
    data: filteredNodes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredNodes.length,
      totalPages: Math.ceil(filteredNodes.length / limit)
    }
  });
});

// Function to format capacity with appropriate unit (TiB or PiB)
function formatCapacity(tib) {
  if (tib >= 1000) {
    const pib = tib / 1024;
    return `${pib.toFixed(2)} PiB`;
  } else {
    return `${tib.toFixed(2)} TiB`;
  }
}

// Function to parse capacity string and return TiB value
function parseCapacityToTiB(capacityStr) {
  if (!capacityStr || capacityStr === 'Unknown' || capacityStr === 'Auto') {
    return 0;
  }
  
  const match = capacityStr.match(/^([\d.]+)\s*(TiB|PiB)$/);
  if (!match) {
    return 0;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  if (unit === 'PiB') {
    return value * 1024; // Convert PiB to TiB
  } else {
    return value; // Already in TiB
  }
}

// Function to calculate total capacity for a list of nodes
function calculateTotalCapacity(nodes) {
  const totalTiB = nodes.reduce((sum, node) => {
    return sum + parseCapacityToTiB(node.capacity);
  }, 0);
  
  return formatCapacity(totalTiB);
}

// Function to fetch real Filecoin node capacity
async function fetchFilecoinCapacity(nodeId) {
  try {
    const response = await fetch(`https://filfox.info/api/v1/address/${nodeId}/power-stats`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const latestStats = data[data.length - 1];
        // Use qualityAdjPower instead of rawBytePower for effective power
        const tib = Number(BigInt(latestStats.qualityAdjPower)) / 1099511627776;
        const rawTib = Number(BigInt(latestStats.rawBytePower)) / 1099511627776;
        const formattedCapacity = formatCapacity(tib);
        console.log(`Node ${nodeId} - Raw: ${rawTib.toFixed(2)} TiB, Quality Adjusted: ${formattedCapacity}`);
        return formattedCapacity;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch capacity for ${nodeId}:`, error);
  }
  return 'Unknown';
}

// Function to fetch real Filecoin daily earnings
async function fetchFilecoinDailyEarnings(nodeId) {
  try {
    const response = await fetch(`https://filfox.info/api/v1/address/${nodeId}/mining-stats?duration=24h`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.totalRewards) {
        // Convert from attoFIL to FIL (divide by 10^18)
        const dailyRewardsFIL = Number(BigInt(data.totalRewards)) / 1e18;
        console.log(`Node ${nodeId} - Daily Rewards: ${dailyRewardsFIL.toFixed(6)} FIL`);
        return dailyRewardsFIL;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch daily earnings for ${nodeId}:`, error);
  }
  return 0;
}

app.post('/api/v1/nodes', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  console.log('POST /api/v1/nodes - Headers:', req.headers);
  console.log('POST /api/v1/nodes - Body:', req.body);
  
  // In development, accept any valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Authentication failed - authHeader:', authHeader);
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { nodeIds, projectId, type, capacity, location, monitorUrl, hardware } = req.body;
  
  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0 || !projectId || !type) {
    console.log('Validation failed - nodeIds:', nodeIds, 'projectId:', projectId, 'type:', type);
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: nodeIds, projectId, type'
    });
  }

  const project = mockProjects.find(p => p.id === projectId);
  if (!project) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID'
    });
  }

  const created = [];
  const failed = [];

  // Process nodes with async capacity fetching
  for (const nodeId of nodeIds) {
    // Check if node already exists
    const existingNode = mockNodes.find(n => n.nodeId === nodeId);
    if (existingNode) {
      failed.push({
        nodeId,
        error: 'Node already exists'
      });
      continue;
    }

    // For Filecoin nodes, fetch real capacity and calculate earnings
    let realCapacity = capacity || 'Auto';
    let dailyEarnings = '0.00/day';
    let nodeMonitorUrl = monitorUrl;
    
    if (project.name === 'Filecoin' && nodeId.startsWith('f0')) {
      console.log(`Fetching real data for Filecoin node: ${nodeId}`);
      try {
        // Fetch both capacity and real earnings
        realCapacity = await fetchFilecoinCapacity(nodeId);
        const realEarnings = await fetchFilecoinDailyEarnings(nodeId);
        
        console.log(`Real capacity for ${nodeId}: ${realCapacity}`);
        console.log(`Real daily earnings for ${nodeId}: ${realEarnings.toFixed(6)} FIL`);
        
        if (realEarnings > 0) {
          dailyEarnings = `${realEarnings.toFixed(2)} FIL/day`;
        }
        
        // Set default Filecoin monitor URL to filfox.info
        if (!nodeMonitorUrl) {
          nodeMonitorUrl = `https://filfox.info/zh/address/${nodeId}`;
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${nodeId}:`, error);
        realCapacity = 'Unknown';
        // Still set monitor URL even if API fails
        if (!nodeMonitorUrl) {
          nodeMonitorUrl = `https://filfox.info/zh/address/${nodeId}`;
        }
      }
    } else {
      // For other project types, use token-based earnings with token symbol
      const baseEarnings = Math.random() * 50 + 10; // 10-60 tokens/day
      const tokenSymbol = project.tokenSymbol || 'TOKEN';
      dailyEarnings = `${baseEarnings.toFixed(2)} ${tokenSymbol}/day`;
    }

    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      network: project.name,
      nodeId,
      type,
      capacity: realCapacity,
      earnings: dailyEarnings,
      status: realCapacity !== 'Unknown' ? 'online' : 'syncing',
      uptime: realCapacity !== 'Unknown' ? '95.2%' : '0%',
      location: location || 'Unknown',
      startDate: new Date().toISOString().split('T')[0],
      totalEarned: 0,
      hardware: hardware || [],
      monitorUrl: nodeMonitorUrl,
      project: {
        id: project.id,
        name: project.name,
        category: project.category,
        blockchain: project.blockchain
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockNodes.push(newNode);
    created.push(newNode);
  }

  res.json({
    success: true,
    data: {
      created,
      failed,
      summary: {
        total: nodeIds.length,
        created: created.length,
        failed: failed.length
      }
    }
  });
});

app.delete('/api/v1/nodes/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // In development, accept any valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { id } = req.params;
  const nodeIndex = mockNodes.findIndex(n => n.id === id);
  
  if (nodeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }

  mockNodes.splice(nodeIndex, 1);

  res.json({
    success: true,
    data: null
  });
});

// Dashboard Routes
app.get('/api/v1/dashboard/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // In development, accept any valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const totalNodes = mockNodes.length;
  const onlineNodes = mockNodes.filter(n => n.status === 'online').length;
  const totalEarnings = mockNodes.reduce((sum, node) => {
    // Extract number from earnings like "50.25 FIL/day" or "24.80 HNT/day"
    const match = node.earnings.match(/^([\d.]+)/);
    const earnings = match ? parseFloat(match[1]) : 0;
    return sum + earnings;
  }, 0);

  const stats = {
    overview: {
      totalNodes,
      onlineNodes,
      totalCapacity: mockNodes.reduce((total, node) => total + ' + ' + node.capacity, '').substring(3) || '0',
      totalEarnings: totalEarnings,
      averageUptime: mockNodes.length > 0 ? 
        (mockNodes.reduce((sum, node) => sum + parseFloat(node.uptime.replace('%', '')), 0) / mockNodes.length).toFixed(1) + '%' : 
        '0%',
      totalProjects: mockProjects.length
    },
    recentActivity: [
      {
        type: 'node_added',
        message: 'New Filecoin node added successfully',
        timestamp: new Date().toISOString(),
        nodeId: 'f0101020',
        projectName: 'Filecoin'
      },
      {
        type: 'capacity_updated',
        message: 'Node capacity updated to 280.97 TiB',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        nodeId: 'f0101020',
        projectName: 'Filecoin'
      }
    ],
    nodesByStatus: [
      {
        status: 'online',
        count: onlineNodes,
        percentage: totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0
      },
      {
        status: 'offline',
        count: mockNodes.filter(n => n.status === 'offline').length,
        percentage: totalNodes > 0 ? Math.round((mockNodes.filter(n => n.status === 'offline').length / totalNodes) * 100) : 0
      },
      {
        status: 'syncing',
        count: mockNodes.filter(n => n.status === 'syncing').length,
        percentage: totalNodes > 0 ? Math.round((mockNodes.filter(n => n.status === 'syncing').length / totalNodes) * 100) : 0
      }
    ],
    nodesByProject: mockProjects.map(project => {
      const projectNodes = mockNodes.filter(n => n.project.id === project.id);
      // Calculate total daily earnings for this project
      const totalDailyEarnings = projectNodes.reduce((sum, node) => {
        // Extract number from earnings like "50.25 FIL/day" or "24.80 HNT/day"
        const match = node.earnings.match(/^([\d.]+)/);
        const earnings = match ? parseFloat(match[1]) : 0;
        return sum + earnings;
      }, 0);
      
      return {
        projectName: project.name,
        category: project.category,
        nodeCount: projectNodes.length,
        totalCapacity: calculateTotalCapacity(projectNodes),
        totalDailyEarnings: totalDailyEarnings,
        averagePerformance: projectNodes.length > 0 && projectNodes[0].performance ? 
          ((100 - projectNodes[0].performance.cpuUsage) + (100 - projectNodes[0].performance.memoryUsage)) / 2 : 
          null
      };
    }),
    earningsChart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      earnings: Math.random() * 100 + 20,
      cumulativeEarnings: (i + 1) * (Math.random() * 100 + 50)
    })),
    performanceMetrics: mockNodes.length > 0 && mockNodes[0].performance ? {
      averageCpuUsage: mockNodes.reduce((sum, node) => sum + (node.performance?.cpuUsage || 0), 0) / mockNodes.length,
      averageMemoryUsage: mockNodes.reduce((sum, node) => sum + (node.performance?.memoryUsage || 0), 0) / mockNodes.length,
      averageDiskUsage: mockNodes.reduce((sum, node) => sum + (node.performance?.diskUsage || 0), 0) / mockNodes.length,
      averageNetworkLatency: mockNodes.reduce((sum, node) => sum + (node.performance?.networkLatency || 0), 0) / mockNodes.length
    } : null,
    topPerformingNodes: mockNodes.slice(0, 5).map(node => ({
      nodeId: node.nodeId,
      projectName: node.network,
      capacity: node.capacity,
      uptime: node.uptime,
      earnings: node.earnings,
      score: Math.random() * 100
    }))
  };

  res.json({
    success: true,
    data: stats
  });
});

app.post('/api/v1/dashboard/capacity/update', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // In development, accept any valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Mock capacity update
  setTimeout(() => {
    // Update some node capacities
    mockNodes.forEach(node => {
      if (node.network === 'Filecoin' && Math.random() > 0.5) {
        const newCapacity = (Math.random() * 500 + 100).toFixed(2);
        node.capacity = `${newCapacity} TiB`;
        node.updatedAt = new Date().toISOString();
      }
    });
  }, 1000);

  res.json({
    success: true,
    data: {
      totalUsers: 1,
      totalUpdated: mockNodes.length,
      totalFailed: 0
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DePIN Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}/api/v1`);
  console.log('📊 Available endpoints:');
  console.log('  - POST /api/v1/auth/message');
  console.log('  - POST /api/v1/auth/authenticate');
  console.log('  - GET /api/v1/auth/verify');
  console.log('  - GET /api/v1/projects');
  console.log('  - GET /api/v1/nodes');
  console.log('  - POST /api/v1/nodes');
  console.log('  - DELETE /api/v1/nodes/:id');
  console.log('  - GET /api/v1/dashboard/stats');
  console.log('  - POST /api/v1/dashboard/capacity/update');
});