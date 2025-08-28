'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, Calendar, DollarSign, Users, Target, Award,
  Clock, AlertTriangle, CheckCircle, Circle,
  TrendingUp, Coins, FileText, Plus, List,
  Flag, User
} from 'lucide-react';
import { DAOProject, DAOMilestone, DAOTask, daoApi } from '@/lib/api';
import { CreateTaskModal } from './CreateTaskModal';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DAOProject | null;
  daoToken: string;
}

export function ProjectDetailsModal({ isOpen, onClose, project, daoToken }: ProjectDetailsModalProps) {
  const [milestones, setMilestones] = useState<DAOMilestone[]>([]);
  const [tasks, setTasks] = useState<DAOTask[]>([]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');

  useEffect(() => {
    if (project?.milestones) {
      setMilestones(project.milestones);
    }
    if (project?.id) {
      fetchTasks(project.id);
    }
  }, [project]);

  const fetchTasks = async (projectId: string) => {
    try {
      console.log('🔄 获取任务列表，项目ID:', projectId);
      const tasksData = await daoApi.getTasks(projectId);
      console.log('📋 获取到任务数据:', tasksData);
      
      const tasks = Array.isArray(tasksData) ? tasksData : [];
      setTasks(tasks);
      console.log(`✅ 设置任务列表完成，共 ${tasks.length} 个任务`);
    } catch (error) {
      console.error('❌ 获取任务失败:', error);
      setTasks([]);
    }
  };

  const handleTaskCreated = () => {
    if (project?.id) {
      fetchTasks(project.id);
    }
  };

  if (!isOpen || !project) return null;

  // Calculate project progress (milestones + tasks)
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
  const totalMilestones = milestones.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;
  
  // Combined progress calculation
  const totalItems = totalMilestones + totalTasks;
  const completedItems = completedMilestones + completedTasks;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Calculate budget utilization
  const budgetUtilization = project.totalBudget > 0 ? (project.spentFunds / project.totalBudget) * 100 : 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning':
        return 'bg-gray-500/10 text-gray-600';
      case 'active':
        return 'bg-blue-500/10 text-blue-600';
      case 'milestone_pending':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'todo':
        return 'bg-gray-500/10 text-gray-600';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600';
      case 'review':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600';
      case 'high':
        return 'bg-orange-500/10 text-orange-600';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'low':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const teamMembers = project.teamMembers ? JSON.parse(project.teamMembers) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-semibold text-gray-900">{project.title}</h2>
                <Badge className={`${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(project.startDate)} - {formatDate(project.expectedEndDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>{project.category}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{project.riskLevel} Risk</span>
                </div>
              </div>
            </div>
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

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                项目概览
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                任务管理 ({tasks.length})
              </button>
            </nav>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">进度</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(progressPercentage)}%
                </div>
                <Progress value={progressPercentage} className="w-full" />
                <div className="text-xs text-gray-600">
                  {completedItems}/{totalItems} 项目完成
                  <div className="text-xs text-gray-500 mt-1">
                    {completedMilestones}/{totalMilestones} 里程碑, {completedTasks}/{totalTasks} 任务
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">预算</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {project.totalBudget.toFixed(2)} SOL
                </div>
                <div className="text-sm text-gray-600">
                  已使用: {project.spentFunds.toFixed(2)} SOL
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(budgetUtilization)}% 预算使用率
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="font-medium">代币奖励</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">
                  {project.tokenReward?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600">{daoToken} 代币</div>
                <div className="text-xs text-gray-500">完成时获得</div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="font-medium">团队</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {teamMembers.length}
                </div>
                <div className="text-sm text-gray-600">团队成员</div>
                <div className="text-xs text-gray-500">协作开发</div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                团队成员
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamMembers.map((member: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{member}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                项目里程碑
              </h3>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getMilestoneStatusIcon(milestone.status)}
                        <div className="flex-1">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>目标日期: {formatDate(milestone.targetDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>预算: {milestone.budget.toFixed(2)} SOL</span>
                            </div>
                            {milestone.completedDate && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>完成: {formatDate(milestone.completedDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={milestone.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                milestone.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}
                      >
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* ROI Information */}
              {project.roi > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center text-yellow-800">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    投资回报率 (ROI)
                  </h3>
                  <div className="text-2xl font-bold text-yellow-800 mb-1">
                    {project.roi.toFixed(2)}%
                  </div>
                  <p className="text-sm text-yellow-700">
                    预期项目完成后的投资回报率
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tasks' && (
            <div>
              {/* Task Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <List className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-medium">项目任务</h3>
                  <Badge variant="secondary">{tasks.length}</Badge>
                </div>
                <Button 
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>创建任务</span>
                </Button>
              </div>

              {/* Task Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{tasks.filter(t => t.status === 'TODO').length}</div>
                  <div className="text-sm text-gray-500">待办</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
                  <div className="text-sm text-gray-500">进行中</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{tasks.filter(t => t.status === 'REVIEW').length}</div>
                  <div className="text-sm text-gray-500">审核中</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'COMPLETED').length}</div>
                  <div className="text-sm text-gray-500">已完成</div>
                </div>
              </div>

              {/* Task List */}
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getTaskStatusIcon(task.status)}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Badge className={getTaskStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                            
                            {/* Task Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-3 w-3" />
                                <span>成本: {task.costEstimate.toFixed(2)} SOL</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Award className="h-3 w-3 text-purple-600" />
                                <span>奖励: {task.tokenReward.toFixed(2)} {daoToken}</span>
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>截止: {formatDate(task.dueDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Task Tags */}
                            {task.tags && JSON.parse(task.tags).length > 0 && (
                              <div className="flex items-center space-x-2 mt-3">
                                <div className="text-xs text-gray-400">标签:</div>
                                <div className="flex flex-wrap gap-1">
                                  {JSON.parse(task.tags).map((tag: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assignee */}
                            {task.assigneeId && (
                              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                <span>负责人: {task.assigneeId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
                  <p className="text-gray-500 mb-4">为此项目创建第一个任务来开始工作。</p>
                  <Button 
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    variant="outline"
                  >
                    创建任务
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {project && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          projectId={project.id}
          daoToken={daoToken}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}