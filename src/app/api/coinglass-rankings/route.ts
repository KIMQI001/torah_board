import { NextResponse } from 'next/server';
import { coinglassFetcher } from '../../../services/coinglass-fetcher';

// GET请求 - 获取4H涨跌榜数据
export async function GET() {
  try {
    console.log('🚀 API调用: 获取Coinglass 4H涨跌榜数据');
    
    const rankingData = await coinglassFetcher.get4HRankings();
    
    return NextResponse.json({
      success: true,
      data: rankingData,
      message: 'Coinglass 4H涨跌榜数据获取成功',
      cache: coinglassFetcher.getCacheInfo()
    });
    
  } catch (error) {
    console.error('❌ Coinglass API调用失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Coinglass rankings',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}

// POST请求 - 强制刷新数据（清除缓存）
export async function POST() {
  try {
    console.log('🔄 API调用: 强制刷新Coinglass数据');
    
    // 清除缓存
    coinglassFetcher.clearCache();
    
    // 重新获取数据
    const rankingData = await coinglassFetcher.get4HRankings();
    
    return NextResponse.json({
      success: true,
      data: rankingData,
      message: 'Coinglass数据强制刷新完成',
      refreshed: true,
      cache: coinglassFetcher.getCacheInfo()
    });
    
  } catch (error) {
    console.error('❌ 强制刷新Coinglass数据失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh Coinglass data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}