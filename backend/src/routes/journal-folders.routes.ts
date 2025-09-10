/**
 * 日志文件夹路由
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { Logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// 获取用户的所有文件夹
router.get('/', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Wallet address not found'
      });
    }

    const folders = await prisma.journalFolder.findMany({
      where: { walletAddress },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    // 格式化文件夹数据
    const formattedFolders = folders.map(folder => ({
      ...folder,
      entryCount: folder._count.entries
    }));

    res.json({
      success: true,
      data: formattedFolders
    });
  } catch (error) {
    Logger.error('Failed to fetch journal folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal folders'
    });
  }
});

// 创建文件夹
router.post('/', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const userId = req.user?.id;
    
    const {
      name,
      description,
      color = "#3B82F6",
      icon = "📁",
      parentId,
      sortOrder = 0
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // 检查父文件夹是否存在且属于用户
    if (parentId) {
      const parentFolder = await prisma.journalFolder.findFirst({
        where: {
          id: parentId,
          walletAddress
        }
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const folder = await prisma.journalFolder.create({
      data: {
        walletAddress,
        userId,
        name: name.trim(),
        description: description?.trim(),
        color,
        icon,
        parentId,
        sortOrder
      },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...folder,
        entryCount: folder._count.entries
      }
    });
  } catch (error) {
    Logger.error('Failed to create journal folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create journal folder'
    });
  }
});

// 更新文件夹
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;
    
    // 检查文件夹是否存在且属于当前用户
    const existingFolder = await prisma.journalFolder.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or unauthorized'
      });
    }

    const {
      name,
      description,
      color,
      icon,
      parentId,
      sortOrder
    } = req.body;

    // 检查父文件夹（如果提供）
    if (parentId && parentId !== id) { // 防止设置自己为父文件夹
      const parentFolder = await prisma.journalFolder.findFirst({
        where: {
          id: parentId,
          walletAddress
        }
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const updatedFolder = await prisma.journalFolder.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(parentId !== undefined && { parentId: parentId === id ? null : parentId }),
        ...(sortOrder !== undefined && { sortOrder })
      },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...updatedFolder,
        entryCount: updatedFolder._count.entries
      }
    });
  } catch (error) {
    Logger.error('Failed to update journal folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update journal folder'
    });
  }
});

// 删除文件夹
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;
    
    // 检查文件夹是否存在且属于当前用户
    const existingFolder = await prisma.journalFolder.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or unauthorized'
      });
    }

    // 使用事务来处理文件夹删除
    await prisma.$transaction(async (tx) => {
      // 将子文件夹移动到父级或根目录
      await tx.journalFolder.updateMany({
        where: {
          parentId: id,
          walletAddress
        },
        data: {
          parentId: existingFolder.parentId
        }
      });

      // 将文件夹中的日志移动到父级文件夹或根目录
      await tx.journalEntry.updateMany({
        where: {
          folderId: id,
          walletAddress
        },
        data: {
          folderId: existingFolder.parentId
        }
      });

      // 删除文件夹
      await tx.journalFolder.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    Logger.error('Failed to delete journal folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete journal folder'
    });
  }
});

// 移动文件夹
router.post('/:id/move', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    const { id } = req.params;
    const { parentId, sortOrder } = req.body;
    
    // 检查文件夹是否存在且属于当前用户
    const existingFolder = await prisma.journalFolder.findFirst({
      where: {
        id,
        walletAddress
      }
    });

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or unauthorized'
      });
    }

    // 检查目标父文件夹（如果提供）
    if (parentId && parentId !== id) {
      const parentFolder = await prisma.journalFolder.findFirst({
        where: {
          id: parentId,
          walletAddress
        }
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }

      // 检查是否会造成循环引用
      const checkCycle = async (checkId: string, targetParentId: string): Promise<boolean> => {
        if (checkId === targetParentId) return true;
        
        const parent = await prisma.journalFolder.findUnique({
          where: { id: targetParentId },
          select: { parentId: true }
        });
        
        if (!parent?.parentId) return false;
        return await checkCycle(checkId, parent.parentId);
      };

      if (await checkCycle(id, parentId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create circular reference'
        });
      }
    }

    const updatedFolder = await prisma.journalFolder.update({
      where: { id },
      data: {
        parentId: parentId === id ? null : parentId,
        ...(sortOrder !== undefined && { sortOrder })
      },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...updatedFolder,
        entryCount: updatedFolder._count.entries
      }
    });
  } catch (error) {
    Logger.error('Failed to move journal folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move journal folder'
    });
  }
});

export default router;