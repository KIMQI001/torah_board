'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, Calendar, DollarSign, Award, User, 
  Flag, FileText, Hash
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { daoApi } from '@/lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  daoToken: string;
  onTaskCreated?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId: string;
  costEstimate: number;
  tokenReward: number;
  dueDate: string;
  tags: string[];
}

export function CreateTaskModal({ 
  isOpen, 
  onClose, 
  projectId, 
  daoToken, 
  onTaskCreated 
}: CreateTaskModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    costEstimate: 0,
    tokenReward: 0,
    dueDate: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前端验证
    if (formData.title.length < 5) {
      setError('任务标题至少需要5个字符');
      return;
    }
    if (formData.title.length > 200) {
      setError('任务标题不能超过200个字符');
      return;
    }
    if (formData.description.length < 10) {
      setError('任务描述至少需要10个字符');
      return;
    }
    if (formData.description.length > 1000) {
      setError('任务描述不能超过1000个字符');
      return;
    }
    if (formData.costEstimate < 0) {
      setError('成本估算不能为负数');
      return;
    }
    if (formData.tokenReward < 0) {
      setError('代币奖励不能为负数');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null, // 空字符串转为null，符合验证规则
        costEstimate: Number(formData.costEstimate) || 0,
        tokenReward: Number(formData.tokenReward) || 0,
        dueDate: formData.dueDate ? formData.dueDate : null, // 直接使用字符串格式，让后端处理
        tags: formData.tags.length > 0 ? formData.tags : null // null而不是undefined
      };

      console.log('🚀 准备创建任务:', {
        projectId,
        taskData,
        formData
      });

      const task = await daoApi.createTask(projectId, taskData);
      console.log('✅ 任务创建成功，完整响应:', task);

      // 检查返回的任务数据
      if (!task || !task.id) {
        console.error('❌ 任务数据无效:', task);
        throw new Error('任务创建失败：服务器返回的数据无效');
      }

      console.log('🎉 任务创建验证通过:', {
        id: task.id,
        title: task.title,
        costEstimate: task.costEstimate,
        tokenReward: task.tokenReward
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        costEstimate: 0,
        tokenReward: 0,
        dueDate: '',
        tags: []
      });

      // 先触发刷新
      console.log('🔄 触发任务列表刷新...');
      onTaskCreated?.();
      
      // 显示成功消息并关闭
      alert(`✅ 任务创建成功！\n\n任务标题: ${task.title}\n成本估算: ${task.costEstimate} SOL\n代币奖励: ${task.tokenReward} ${daoToken}\n优先级: ${task.priority}`);
      
      onClose();
    } catch (error) {
      console.error('❌ 创建任务失败:', error);
      let errorMessage = '创建任务失败，请重试';
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid or expired token') || msg.includes('unauthorized')) {
          errorMessage = '❌ 认证失败：请先连接钱包并完成登录验证';
        } else if (msg.includes('401')) {
          errorMessage = '❌ 未授权：请先登录';
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage = '❌ 权限不足：只有DAO成员可以创建任务';
        } else if (msg.includes('404') || msg.includes('not found')) {
          errorMessage = '❌ 项目不存在：请确认项目ID有效';
        } else if (msg.includes('400') || msg.includes('validation')) {
          errorMessage = '❌ 数据验证失败：请检查输入内容';
        } else {
          errorMessage = `❌ ${error.message || errorMessage}`;
        }
      }
      
      // 显示详细的错误信息用于调试
      const debugInfo = `
错误详情：
- 项目ID: ${projectId}
- 用户已登录: ${localStorage.getItem('auth_token') ? '是' : '否'}
- 错误信息: ${error instanceof Error ? error.message : '未知错误'}

请确保：
1. 已连接Solana钱包
2. 已完成登录验证  
3. 是DAO成员
4. 项目ID有效
`;
      
      console.error(debugInfo);
      alert(errorMessage + '\n\n查看控制台了解详细错误信息');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && 
        !formData.tags.includes(trimmedTag) && 
        trimmedTag.length <= 20 && 
        formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setNewTag('');
      setError(''); // 清除之前的错误
    } else if (trimmedTag.length > 20) {
      setError('标签长度不能超过20个字符');
    } else if (formData.tags.length >= 10) {
      setError('标签数量不能超过10个');
    } else if (formData.tags.includes(trimmedTag)) {
      setError('标签已存在');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-600';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'LOW':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">创建新任务</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Authentication Warning */}
          {!localStorage.getItem('auth_token') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">认证提醒</span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                创建任务需要钱包认证。请先连接Solana钱包并完成登录验证。
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">验证错误</span>
              </div>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          )}
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              任务标题 * <span className="text-xs text-gray-500">(5-200字符)</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.title.length > 0 && formData.title.length < 5 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="输入任务标题...（至少5个字符）"
            />
            {formData.title.length > 0 && formData.title.length < 5 && (
              <p className="text-xs text-red-600 mt-1">标题至少需要5个字符</p>
            )}
            {formData.title.length > 200 && (
              <p className="text-xs text-red-600 mt-1">标题不能超过200个字符</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述 * <span className="text-xs text-gray-500">(10-1000字符)</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              maxLength={1000}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.description.length > 0 && formData.description.length < 10 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="详细描述任务内容和要求...（至少10个字符）"
            />
            {formData.description.length > 0 && formData.description.length < 10 && (
              <p className="text-xs text-red-600 mt-1">描述至少需要10个字符</p>
            )}
            {formData.description.length > 1000 && (
              <p className="text-xs text-red-600 mt-1">描述不能超过1000个字符</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="h-4 w-4 inline mr-1" />
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">低优先级</option>
                <option value="MEDIUM">中优先级</option>
                <option value="HIGH">高优先级</option>
                <option value="URGENT">紧急</option>
              </select>
              <div className="mt-2">
                <Badge className={getPriorityColor(formData.priority)}>
                  {formData.priority}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                截止日期
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cost and Token Reward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                成本估算 (SOL)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costEstimate}
                onChange={(e) => setFormData(prev => ({ ...prev, costEstimate: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.costEstimate < 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formData.costEstimate < 0 && (
                <p className="text-xs text-red-600 mt-1">成本估算不能为负数</p>
              )}
              <p className="text-xs text-gray-500 mt-1">完成此任务预计需要的成本</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="h-4 w-4 inline mr-1" />
                代币奖励 ({daoToken})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tokenReward}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenReward: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.tokenReward < 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formData.tokenReward < 0 && (
                <p className="text-xs text-red-600 mt-1">代币奖励不能为负数</p>
              )}
              <p className="text-xs text-gray-500 mt-1">完成后获得的治理代币奖励</p>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              指派给
            </label>
            <input
              type="text"
              value={formData.assigneeId}
              onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入用户ID或留空稍后指派"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              标签 <span className="text-xs text-gray-500">(最多10个，每个最多20字符)</span>
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                maxLength={20}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  newTag.length > 20 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="输入标签..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.length >= 10 || newTag.length > 20}
              >
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || 
                !formData.title || 
                !formData.description ||
                formData.title.length < 5 ||
                formData.title.length > 200 ||
                formData.description.length < 10 ||
                formData.description.length > 1000 ||
                formData.costEstimate < 0 ||
                formData.tokenReward < 0
              }
            >
              {isLoading ? '创建中...' : '创建任务'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}