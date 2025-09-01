const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 添加示例 DePIN 项目...');

  // 示例项目数据
  const projects = [
    {
      name: 'Filecoin Storage Network',
      category: 'STORAGE', 
      description: 'Decentralized storage network that turns cloud storage into an algorithmic market.',
      blockchain: 'Filecoin',
      tokenSymbol: 'FIL',
      tokenPrice: 6.20,
      marketCap: '$1.8B',
      volume24h: '$245M',
      apy: '8.5%',
      minInvestment: 1000,
      roiPeriod: 12,
      geographicFocus: JSON.stringify(['Global']),
      riskLevel: 'MEDIUM',
      hardwareRequirements: JSON.stringify([]),
      websiteUrl: 'https://filecoin.io'
    },
    {
      name: 'Helium IoT Network',
      category: 'WIRELESS',
      description: 'Decentralized wireless network for IoT devices powered by crypto incentives.',
      blockchain: 'Solana',
      tokenSymbol: 'HNT', 
      tokenPrice: 8.45,
      marketCap: '$1.2B',
      volume24h: '$128M',
      apy: '12.3%',
      minInvestment: 500,
      roiPeriod: 8,
      geographicFocus: JSON.stringify(['North America', 'Europe']),
      riskLevel: 'MEDIUM',
      hardwareRequirements: JSON.stringify([]),
      websiteUrl: 'https://www.helium.com'
    },
    {
      name: 'Render Network',
      category: 'COMPUTING',
      description: 'Distributed GPU rendering network for digital content creation.',
      blockchain: 'Ethereum',
      tokenSymbol: 'RNDR',
      tokenPrice: 12.85,
      marketCap: '$4.8B', 
      volume24h: '$892M',
      apy: '15.7%',
      minInvestment: 2000,
      roiPeriod: 6,
      geographicFocus: JSON.stringify(['Global']),
      riskLevel: 'HIGH',
      hardwareRequirements: JSON.stringify([]),
      websiteUrl: 'https://rendertoken.com'
    },
    {
      name: 'Hivemapper Drive-to-Earn',
      category: 'SENSORS',
      description: 'Decentralized mapping network where drivers earn crypto for contributing map data.',
      blockchain: 'Solana',
      tokenSymbol: 'HONEY',
      tokenPrice: 0.285,
      marketCap: '$142M',
      volume24h: '$8.2M',
      apy: '22.4%',
      minInvestment: 200,
      roiPeriod: 4,
      geographicFocus: JSON.stringify(['Global']),
      riskLevel: 'LOW',
      hardwareRequirements: JSON.stringify([]),
      websiteUrl: 'https://hivemapper.com'
    }
  ];

  for (const project of projects) {
    try {
      const created = await prisma.dePINProject.create({
        data: project
      });
      console.log(`✅ 创建: ${created.name}`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️ 项目已存在: ${project.name}`);
      } else {
        console.error(`❌ 创建失败: ${project.name}`, error.message);
      }
    }
  }

  console.log('🎉 完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });