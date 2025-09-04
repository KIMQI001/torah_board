import { Router } from 'express';
import { AirdropController } from '@/controllers/airdrop.controller';

const router = Router();

// ==================== 活跃空投管理 ====================

/**
 * @route GET /api/v1/airdrop/active
 * @desc 获取活跃空投列表
 * @query {string} [chain] - 区块链筛选
 * @query {string} [status] - 状态筛选 
 * @query {boolean} [isHot] - 是否热门
 * @query {string} [category] - 类别筛选
 * @query {number} [limit=20] - 分页大小
 * @query {number} [offset=0] - 分页偏移
 */
router.get('/active', AirdropController.getActiveAirdrops);

/**
 * @route POST /api/v1/airdrop/active
 * @desc 创建活跃空投项目
 * @body {CreateActiveAirdropData} - 空投项目数据
 */
router.post('/active', AirdropController.createActiveAirdrop);

/**
 * @route PUT /api/v1/airdrop/active/:id
 * @desc 更新活跃空投项目
 * @param {string} id - 空投项目ID
 * @body {Partial<CreateActiveAirdropData>} - 更新数据
 */
router.put('/active/:id', AirdropController.updateActiveAirdrop);

/**
 * @route DELETE /api/v1/airdrop/active/:id
 * @desc 删除活跃空投项目
 * @param {string} id - 空投项目ID
 */
router.delete('/active/:id', AirdropController.deleteActiveAirdrop);

// ==================== 用户空投项目管理 ====================

/**
 * @route GET /api/v1/airdrop/user-projects
 * @desc 获取用户空投项目列表
 * @query {string} [walletAddress] - 钱包地址
 * @query {string} [status] - 项目状态筛选
 * @query {number} [limit=20] - 分页大小  
 * @query {number} [offset=0] - 分页偏移
 */
router.get('/user-projects', AirdropController.getUserAirdropProjects);

/**
 * @route POST /api/v1/airdrop/user-projects
 * @desc 创建用户空投项目
 * @body {CreateUserAirdropProjectData} - 用户项目数据
 */
router.post('/user-projects', AirdropController.createUserAirdropProject);

/**
 * @route PUT /api/v1/airdrop/user-projects/:id
 * @desc 更新用户空投项目
 * @param {string} id - 用户项目ID
 * @body {Partial<CreateUserAirdropProjectData>} - 更新数据
 */
router.put('/user-projects/:id', AirdropController.updateUserAirdropProject);

/**
 * @route DELETE /api/v1/airdrop/user-projects/:id
 * @desc 删除用户空投项目
 * @param {string} id - 用户项目ID
 */
router.delete('/user-projects/:id', AirdropController.deleteUserAirdropProject);

/**
 * @route GET /api/v1/airdrop/wallet/:walletAddress
 * @desc 根据钱包地址获取用户项目
 * @param {string} walletAddress - 钱包地址
 */
router.get('/wallet/:walletAddress', AirdropController.getUserProjectsByWallet);

// ==================== 管理和统计 ====================

/**
 * @route POST /api/v1/airdrop/initialize
 * @desc 初始化默认活跃空投数据
 */
router.post('/initialize', AirdropController.initializeDefaultAirdrops);

/**
 * @route GET /api/v1/airdrop/stats
 * @desc 获取空投统计信息
 */
router.get('/stats', AirdropController.getAirdropStats);

export { router as airdropRoutes };