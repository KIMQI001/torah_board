const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testCEXDB() {
  try {
    console.log('Testing CEX announcements database...');
    
    // 创建测试数据
    const testAnnouncement = {
      exchangeId: 'binance_test_123',
      exchange: 'binance',
      title: '测试公告',
      content: '这是一个测试公告内容',
      category: 'listing',
      importance: 'high',
      publishTime: new Date(),
      tags: JSON.stringify(['BTC', '测试']),
      url: 'https://example.com/test',
      hash: crypto.createHash('md5').update('测试公告|这是一个测试公告内容').digest('hex'),
      isProcessed: true
    };
    
    // 插入测试数据
    const result = await prisma.cEXAnnouncement.upsert({
      where: {
        exchangeId_exchange: {
          exchangeId: testAnnouncement.exchangeId,
          exchange: testAnnouncement.exchange
        }
      },
      update: testAnnouncement,
      create: testAnnouncement
    });
    
    console.log('Inserted test announcement:', result);
    
    // 查询数据
    const count = await prisma.cEXAnnouncement.count();
    console.log('Total announcements in DB:', count);
    
    // 查询最新的公告
    const latest = await prisma.cEXAnnouncement.findMany({
      take: 5,
      orderBy: { publishTime: 'desc' }
    });
    
    console.log('Latest announcements:', latest.map(a => ({ 
      exchange: a.exchange, 
      title: a.title,
      publishTime: a.publishTime 
    })));
    
  } catch (error) {
    console.error('Error testing CEX DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCEXDB();