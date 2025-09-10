import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 使用文件存储确保数据持久化
const DATA_DIR = path.join(process.cwd(), 'data');
const JOURNAL_FILE = path.join(DATA_DIR, 'journal-entries.json');

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
  
  if (process.env.NODE_ENV === 'development') {
    return 'dev_wallet_123456';
  }
  
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const journalEntries = getJournalEntries();
    const entry = journalEntries.find(entry => entry.id === id && entry.walletAddress === walletAddress);

    if (!entry) {
      return NextResponse.json({
        success: false,
        error: 'Entry not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch entry'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const journalEntries = getJournalEntries();
    const entryIndex = journalEntries.findIndex(entry => entry.id === id && entry.walletAddress === walletAddress);

    if (entryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Entry not found or access denied'
      }, { status: 404 });
    }

    // 更新条目
    const updatedEntry = {
      ...journalEntries[entryIndex],
      ...body,
      updatedAt: new Date().toISOString(),
      excerpt: body.content ? body.content.slice(0, 150) + (body.content.length > 150 ? '...' : '') : journalEntries[entryIndex].excerpt
    };

    journalEntries[entryIndex] = updatedEntry;
    saveJournalEntries(journalEntries);

    return NextResponse.json({
      success: true,
      data: updatedEntry
    });

  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update entry'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const journalEntries = getJournalEntries();
    const entryIndex = journalEntries.findIndex(entry => entry.id === id && entry.walletAddress === walletAddress);

    if (entryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Entry not found or access denied'
      }, { status: 404 });
    }

    // 删除条目
    journalEntries.splice(entryIndex, 1);
    saveJournalEntries(journalEntries);

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete entry'
    }, { status: 500 });
  }
}