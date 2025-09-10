/**
 * 交易日志路由
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { Logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// 获取用户的所有日志条目
router.get('/entries', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Wallet address not found'
      });
    }

    const { 
      category, 
      folderId,
      search, 
      limit = 20, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const where: any = {
      walletAddress
    };

    if (category) {
      where.category = category as string;
    }

    // 文件夹筛选
    if (folderId === 'null' || folderId === '') {
      // 查询根目录（没有文件夹）的条目
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
      ];
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        category: true,
        tags: true,
        sentiment: true,
        imageUrls: true,
        tradeData: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const total = await prisma.journalEntry.count({ where });

    // 解析JSON字段
    const formattedEntries = entries.map(entry => ({
      ...entry,
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      imageUrls: entry.imageUrls ? JSON.parse(entry.imageUrls) : [],
      tradeData: entry.tradeData ? JSON.parse(entry.tradeData) : null
    }));

    res.json({
      success: true,
      data: {
        entries: formattedEntries,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    Logger.error('Failed to fetch journal entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal entries'
    });
  }
});

// 获取单个日志条目
router.get('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // 解析JSON字段
    const formattedEntry = {
      ...entry,
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      tradeData: entry.tradeData ? JSON.parse(entry.tradeData) : null,
      imageUrls: entry.imageUrls ? JSON.parse(entry.imageUrls) : []
    };

    res.json({
      success: true,
      data: formattedEntry
    });
  } catch (error) {
    Logger.error('Failed to fetch journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal entry'
    });
  }
});

// 创建日志条目
router.post('/entries', authMiddleware, async (req, res) => {
  try {

    const walletAddress = req.user?.walletAddress;
    const userId = req.user?.id;
    
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
    } = req.body;

    // 生成摘要
    const excerpt = content.slice(0, 150) + (content.length > 150 ? '...' : '');

    // 检查文件夹是否存在且属于用户（如果提供了文件夹ID）
    if (folderId) {
      const folder = await prisma.journalFolder.findFirst({
        where: {
          id: folderId,
          walletAddress
        }
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    const entry = await prisma.journalEntry.create({
      data: {
        walletAddress,
        userId,
        title,
        content,
        excerpt,
        category,
        tags: JSON.stringify(tags),
        folderId,
        tradeData: tradeData ? JSON.stringify(tradeData) : null,
        imageUrls: JSON.stringify(imageUrls),
        isPublic,
        sentiment
      }
    });

    res.json({
      success: true,
      data: {
        ...entry,
        tags: JSON.parse(entry.tags),
        tradeData: entry.tradeData ? JSON.parse(entry.tradeData) : null,
        imageUrls: JSON.parse(entry.imageUrls || '[]')
      }
    });
  } catch (error) {
    Logger.error('Failed to create journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create journal entry'
    });
  }
});

// 更新日志条目
router.put('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;
    
    // 检查条目是否存在且属于当前用户
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or unauthorized'
      });
    }

    const {
      title,
      content,
      category,
      tags,
      tradeData,
      imageUrls,
      isPublic,
      sentiment
    } = req.body;

    // 生成新的摘要
    const excerpt = content ? 
      content.slice(0, 150) + (content.length > 150 ? '...' : '') : 
      existingEntry.excerpt;

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content, excerpt }),
        ...(category && { category }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(tradeData !== undefined && { tradeData: tradeData ? JSON.stringify(tradeData) : null }),
        ...(imageUrls && { imageUrls: JSON.stringify(imageUrls) }),
        ...(isPublic !== undefined && { isPublic }),
        ...(sentiment && { sentiment })
      }
    });

    res.json({
      success: true,
      data: {
        ...updatedEntry,
        tags: JSON.parse(updatedEntry.tags),
        tradeData: updatedEntry.tradeData ? JSON.parse(updatedEntry.tradeData) : null,
        imageUrls: JSON.parse(updatedEntry.imageUrls || '[]')
      }
    });
  } catch (error) {
    Logger.error('Failed to update journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update journal entry'
    });
  }
});

// 删除日志条目
router.delete('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;
    
    // 检查条目是否存在且属于当前用户
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or unauthorized'
      });
    }

    await prisma.journalEntry.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    Logger.error('Failed to delete journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete journal entry'
    });
  }
});

// 获取日志统计信息
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    
    // 总条目数
    const totalEntries = await prisma.journalEntry.count({
      where: { walletAddress }
    });

    // 各分类统计
    const categoryStats = await prisma.journalEntry.groupBy({
      by: ['category'],
      where: { walletAddress },
      _count: true
    });

    // 本周条目数
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const thisWeekCount = await prisma.journalEntry.count({
      where: {
        walletAddress,
        createdAt: {
          gte: weekAgo
        }
      }
    });

    // 市场情绪分布
    const sentimentStats = await prisma.journalEntry.groupBy({
      by: ['sentiment'],
      where: { 
        walletAddress,
        sentiment: {
          not: null
        }
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        totalEntries,
        thisWeekCount,
        categories: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count
        })),
        sentiment: sentimentStats.map(stat => ({
          sentiment: stat.sentiment,
          count: stat._count
        }))
      }
    });
  } catch (error) {
    Logger.error('Failed to fetch journal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal stats'
    });
  }
});

// 导出日志条目
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    
    const entries = await prisma.journalEntry.findMany({
      where: { walletAddress },
      orderBy: { createdAt: 'desc' }
    });

    // 格式化条目
    const formattedEntries = entries.map(entry => ({
      ...entry,
      tags: JSON.parse(entry.tags),
      tradeData: entry.tradeData ? JSON.parse(entry.tradeData) : null,
      imageUrls: entry.imageUrls ? JSON.parse(entry.imageUrls) : []
    }));

    res.json({
      success: true,
      data: formattedEntries
    });
  } catch (error) {
    Logger.error('Failed to export journal entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export journal entries'
    });
  }
});

export default router;