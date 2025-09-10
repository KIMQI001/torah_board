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

export async function GET(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const journalEntries = getJournalEntries();
    const userEntries = journalEntries.filter(entry => entry.walletAddress === walletAddress);

    return NextResponse.json({
      success: true,
      data: userEntries
    });

  } catch (error) {
    console.error('Error exporting journal entries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export entries'
    }, { status: 500 });
  }
}