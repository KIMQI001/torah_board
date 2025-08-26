import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleProjects = [
  {
    name: 'Filecoin Storage Network',
    category: 'STORAGE',
    description: 'Decentralized storage network built on IPFS protocol for secure and efficient file storage',
    blockchain: 'Filecoin',
    tokenSymbol: 'FIL',
    tokenPrice: 4.23,
    marketCap: '$2.1B',
    volume24h: '$89M',
    apy: '12.5%',
    minInvestment: 7000,
    roiPeriod: 18,
    geographicFocus: JSON.stringify(['Global']),
    riskLevel: 'MEDIUM',
    hardwareRequirements: JSON.stringify([
      { type: 'storage', requirement: '32-128 TiB SSD', cost: 5000, powerConsumption: 300 },
      { type: 'cpu', requirement: '8-core 2.8GHz+', cost: 800, powerConsumption: 95 },
      { type: 'memory', requirement: '128-256 GB RAM', cost: 1200, powerConsumption: 50 }
    ])
  },
  {
    name: 'Helium Wireless Network',
    category: 'WIRELESS',
    description: 'Decentralized wireless network for IoT devices, migrated to Solana blockchain',
    blockchain: 'Solana',
    tokenSymbol: 'HNT',
    tokenPrice: 2.45,
    marketCap: '$450M',
    volume24h: '$24M',
    apy: '8.3%',
    minInvestment: 600,
    roiPeriod: 12,
    geographicFocus: JSON.stringify(['North America', 'Europe', 'Asia']),
    riskLevel: 'LOW',
    hardwareRequirements: JSON.stringify([
      { type: 'network', requirement: 'Helium Hotspot', cost: 500, powerConsumption: 5 },
      { type: 'network', requirement: 'Internet Connection', cost: 50, powerConsumption: 10 }
    ])
  },
  {
    name: 'Render GPU Computing Network',
    category: 'COMPUTING',
    description: 'Distributed GPU rendering network for 3D graphics and AI workloads',
    blockchain: 'Ethereum',
    tokenSymbol: 'RNDR',
    tokenPrice: 3.12,
    marketCap: '$1.2B',
    volume24h: '$45M',
    apy: '18.2%',
    minInvestment: 2500,
    roiPeriod: 10,
    geographicFocus: JSON.stringify(['Global']),
    riskLevel: 'HIGH',
    hardwareRequirements: JSON.stringify([
      { type: 'gpu', requirement: 'RTX 4090 or better', cost: 1800, powerConsumption: 450 },
      { type: 'cpu', requirement: '12-core CPU', cost: 600, powerConsumption: 150 },
      { type: 'memory', requirement: '64GB RAM', cost: 400, powerConsumption: 30 }
    ])
  },
  {
    name: 'Hivemapper Sensor Network',
    category: 'SENSORS',
    description: 'Decentralized mapping network using dashcam data for real-time mapping',
    blockchain: 'Solana',
    tokenSymbol: 'HONEY',
    tokenPrice: 0.08,
    marketCap: '$80M',
    volume24h: '$2M',
    apy: '25.6%',
    minInvestment: 300,
    roiPeriod: 8,
    geographicFocus: JSON.stringify(['North America', 'Europe']),
    riskLevel: 'HIGH',
    hardwareRequirements: JSON.stringify([
      { type: 'sensor', requirement: 'Dashcam with GPS', cost: 200, powerConsumption: 15 },
      { type: 'network', requirement: '4G/5G Connection', cost: 100, powerConsumption: 20 }
    ])
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample projects
  for (const project of sampleProjects) {
    try {
      await prisma.dePINProject.upsert({
        where: { name: project.name },
        update: project,
        create: project
      });
      console.log(`✅ Created/Updated project: ${project.name}`);
    } catch (error) {
      console.error(`❌ Failed to create project ${project.name}:`, error.message);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });