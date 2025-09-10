import { NextResponse } from 'next/server';
import { odailyFetcher, OdailyNewsItem } from '../../../services/odaily-fetcher';

// 现在使用专门的 Odaily 服务来获取实时数据
// 服务包含自动缓存、定时更新和真实数据获取功能

export async function GET(request: Request) {
  try {
    // 使用新的Odaily服务获取实时数据
    const latestNews = odailyFetcher.getNews(10);
    const cacheInfo = odailyFetcher.getCacheInfo();
    
    return NextResponse.json({
      success: true,
      items: latestNews,
      total: latestNews.length,
      source: 'Odaily',
      realData: true,
      cacheTime: cacheInfo.lastUpdate,
      cacheAge: cacheInfo.cacheAge,
      isExpired: cacheInfo.isExpired,
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in Odaily API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch news',
      items: []
    }, { status: 500 });
  }
}

// POST请求支持
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { limit = 10, keyword } = body;
    
    let newsData: OdailyNewsItem[];
    
    // 根据关键词筛选
    if (keyword) {
      newsData = odailyFetcher.filterNews(keyword, limit);
    } else {
      newsData = odailyFetcher.getNews(limit);
    }
    
    return NextResponse.json({
      success: true,
      items: newsData,
      total: newsData.length,
      source: 'Odaily',
      realData: true,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        items: []
      },
      { status: 500 }
    );
  }
}

// 数据更新现在由 odailyFetcher 服务自动处理
// 该服务每5分钟自动获取最新的 Odaily 快讯数据
// 并提供缓存、过期检查和相对时间计算功能