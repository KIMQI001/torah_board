const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建 DePIN 项目...');

  // 简化的项目数据，只包含必需字段
  const projects = [
    {
      name: 'Filecoin Storage Network',
      category: 'STORAGE',
      description: 'Decentralized storage network that turns cloud storage into an algorithmic market.',
      blockchain: 'Filecoin',
      tokenSymbol: 'FIL',
      tokenPrice: 6.20,
      apy: '8.5%',
      minInvestment: 1000,
      roiPeriod: 12,
      geographicFocus: JSON.stringify(['Global']),
      riskLevel: 'MEDIUM',
      hardwareRequirements: JSON.stringify([])
    },
    {
      name: 'Helium IoT Network', 
      category: 'WIRELESS',
      description: 'Decentralized wireless network for IoT devices powered by crypto incentives.',
      blockchain: 'Solana',
      tokenSymbol: 'HNT',
      tokenPrice: 8.45,
      apy: '12.3%',
      minInvestment: 500,
      roiPeriod: 8,
      geographicFocus: JSON.stringify(['North America', 'Europe']),
      riskLevel: 'MEDIUM',
      hardwareRequirements: JSON.stringify([])
    }
  ];

  for (const project of projects) {
    try {
      const created = await prisma.dePINProject.create({
        data: project
      });
      console.log(`✅ 创建项目: ${created.name}`);
    } catch (error) {
      console.error(`❌ 创建项目失败: ${project.name}`, error.message);
    }
  }

  console.log('完成！');
}

main()
  .catch((e) => {
    console.error('种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });