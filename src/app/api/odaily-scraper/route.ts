import { NextResponse } from 'next/server';
import { scrapeOdailyRealTime } from '@/services/odaily-scraper';

// 用于存储最新抓取的数据
let latestScrapedData: any[] = [];
let lastScrapeTime = 0;
const SCRAPE_INTERVAL = 30 * 1000; // 30秒 - 快速测试刷新

// 实时抓取Odaily数据的API
export async function GET() {
  try {
    const now = Date.now();
    
    // 检查是否需要重新抓取
    if (now - lastScrapeTime < SCRAPE_INTERVAL && latestScrapedData.length > 0) {
      return NextResponse.json({
        success: true,
        data: latestScrapedData,
        cached: true,
        lastScrape: lastScrapeTime
      });
    }
    
    console.log('🚀 开始实时抓取Odaily数据...');
    
    // 调用抓取服务
    const scrapedData = await scrapeOdailyRealTime();
    
    if (scrapedData && scrapedData.length > 0) {
      latestScrapedData = scrapedData;
      lastScrapeTime = now;
      
      return NextResponse.json({
        success: true,
        data: scrapedData,
        cached: false,
        lastScrape: lastScrapeTime,
        count: scrapedData.length
      });
    }
    
    throw new Error('抓取到的数据为空');
    
  } catch (error) {
    console.error('❌ 抓取Odaily数据失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape Odaily data',
      fallbackData: latestScrapedData.length > 0 ? latestScrapedData : []
    }, { status: 500 });
  }
}

// POST请求用于手动触发抓取
export async function POST() {
  try {
    console.log('🔄 手动触发Odaily数据抓取...');
    
    const scrapedData = await scrapeOdailyRealTime();
    latestScrapedData = scrapedData;
    lastScrapeTime = Date.now();
    
    return NextResponse.json({
      success: true,
      data: scrapedData,
      message: '手动抓取完成',
      count: scrapedData.length
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Manual scrape failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}