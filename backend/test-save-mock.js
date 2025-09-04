const { CEXAnnouncementsService } = require('./dist/services/cex-announcements.service');

async function testSaveMock() {
  try {
    console.log('Testing save mock data...');
    
    // 模拟一些数据
    const mockAnnouncements = [
      {
        id: 'binance_test_456',
        exchange: 'binance',
        title: '币安将上线 TEST 代币',
        content: '测试内容',
        category: 'listing',
        importance: 'high',
        publishTime: Date.now(),
        tags: ['TEST', '上线'],
        url: 'https://binance.com/test'
      },
      {
        id: 'okx_test_789',
        exchange: 'okx',
        title: 'OKX测试公告',
        content: 'OKX测试内容',
        category: 'trading',
        importance: 'medium',
        publishTime: Date.now() - 3600000,
        tags: ['OKX', '测试'],
        url: 'https://okx.com/test'
      }
    ];
    
    await CEXAnnouncementsService.saveAnnouncementsToDB(mockAnnouncements);
    console.log('Mock data saved successfully');
    
    const dbData = await CEXAnnouncementsService.getAnnouncementsFromDB({ limit: 10 });
    console.log('Data from DB:', dbData.length, 'announcements');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSaveMock();