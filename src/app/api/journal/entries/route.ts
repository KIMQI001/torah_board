import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 使用文件存储替代内存存储，确保数据持久化
const DATA_DIR = path.join(process.cwd(), 'data');
const JOURNAL_FILE = path.join(DATA_DIR, 'journal-entries.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 读取日志数据
function getJournalEntries(): any[] {
  try {
    if (fs.existsSync(JOURNAL_FILE)) {
      const data = fs.readFileSync(JOURNAL_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading journal entries:', error);
  }
  return [];
}

// 保存日志数据
function saveJournalEntries(entries: any[]): void {
  try {
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error('Error saving journal entries:', error);
  }
}

function getWalletAddress(request: Request): string | null {
  const walletHeader = request.headers.get('x-wallet-address');
  if (walletHeader) {
    return walletHeader;
  }
  
  // 开发模式下的临时解决方案
  if (process.env.NODE_ENV === 'development') {
    return 'dev_wallet_123456';
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // 读取持久化数据并过滤属于当前钱包地址的条目
    const allEntries = getJournalEntries();
    let filteredEntries = allEntries.filter(entry => entry.walletAddress === walletAddress);

    // 应用搜索和分类过滤
    if (category) {
      filteredEntries = filteredEntries.filter(entry => entry.category === category);
    }

    if (search) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 排序和分页
    const sortedEntries = filteredEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const paginatedEntries = sortedEntries.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        entries: paginatedEntries,
        total: filteredEntries.length
      }
    });

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch entries'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category,
      tags = [],
      folderId,
      tradeData,
      imageUrls = [],
      isPublic = false,
      sentiment
    } = body;

    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const newEntry = {
      id: Date.now().toString(),
      walletAddress,
      userId: null,
      title,
      content,
      excerpt: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
      category,
      tags,
      folderId,
      tradeData,
      imageUrls,
      isPublic,
      sentiment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 读取现有数据，添加新条目，然后保存
    const allEntries = getJournalEntries();
    allEntries.push(newEntry);
    saveJournalEntries(allEntries);

    return NextResponse.json({
      success: true,
      data: newEntry
    });

  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create entry'
    }, { status: 500 });
  }
}