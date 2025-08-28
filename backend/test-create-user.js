const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { walletAddress: 'test-wallet-123' },
      update: {},
      create: {
        walletAddress: 'test-wallet-123',
        username: 'testuser',
        email: 'test@example.com'
      },
    });
    
    console.log('✅ Created/found user:', user);
    
    // Create test DAO
    const dao = await prisma.dAO.upsert({
      where: { name: 'Test DAO' },
      update: {},
      create: {
        name: 'Test DAO',
        description: 'A test DAO for development',
        treasuryAddress: 'test-treasury-123',
        governanceToken: 'TEST',
        totalSupply: 1000000,
        quorumThreshold: 50,
        votingPeriod: 7,
        status: 'ACTIVE'
      },
    });
    
    console.log('✅ Created/found DAO:', dao);
    
    // Add user as admin member of DAO
    const member = await prisma.dAOMember.upsert({
      where: {
        daoId_userId: {
          daoId: dao.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        daoId: dao.id,
        userId: user.id,
        role: 'ADMIN',
        votingPower: 100,
        contributionScore: 0
      },
    });
    
    console.log('✅ Created/found member:', member);
    
    console.log('\n📝 Test data ready:');
    console.log('User ID:', user.id);
    console.log('DAO ID:', dao.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();