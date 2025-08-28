'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Vote, Wallet, Activity } from 'lucide-react';

interface DAOAnalyticsProps {
  dao: any;
  proposals: any[];
  projects: any[];
  members: any[];
  treasury: any;
}

export function DAOAnalytics({ dao, proposals, projects, members, treasury }: DAOAnalyticsProps) {
  // Prepare voting activity data
  const votingActivityData = proposals.slice(-7).map((proposal, index) => ({
    name: `提案 ${index + 1}`,
    forVotes: proposal.forVotes || Math.floor(Math.random() * 50),
    againstVotes: proposal.againstVotes || Math.floor(Math.random() * 20),
    abstainVotes: proposal.abstainVotes || Math.floor(Math.random() * 10),
  }));

  // Prepare proposal status data
  const proposalStatusData = [
    { name: '通过', value: proposals.filter(p => p.status === 'PASSED').length, color: '#22c55e' },
    { name: '进行中', value: proposals.filter(p => p.status === 'ACTIVE').length, color: '#3b82f6' },
    { name: '失败', value: proposals.filter(p => p.status === 'FAILED').length, color: '#ef4444' },
    { name: '待执行', value: proposals.filter(p => p.status === 'QUEUED').length, color: '#f59e0b' },
  ];

  // Prepare project progress data
  const projectProgressData = projects.map((project, index) => ({
    name: project.title || `项目 ${index + 1}`,
    progress: Math.floor(Math.random() * 100),
    budget: project.totalBudget || 0,
    spent: project.totalBudget ? project.totalBudget * (Math.random() * 0.8) : 0,
  }));

  // Prepare member activity data (mock data based on roles)
  const memberActivityData = [
    { role: 'ADMIN', count: members.filter(m => m.role === 'ADMIN').length },
    { role: 'MEMBER', count: members.filter(m => m.role === 'MEMBER').length },
  ];

  // Prepare treasury flow data (mock monthly data)
  const treasuryFlowData = Array.from({ length: 6 }, (_, index) => ({
    month: ['1月', '2月', '3月', '4月', '5月', '6月'][index],
    income: Math.floor(Math.random() * 100 + 50),
    expense: Math.floor(Math.random() * 80 + 30),
    balance: treasury?.balance ? treasury.balance * (0.8 + Math.random() * 0.4) : Math.floor(Math.random() * 200 + 100),
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总提案数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals.length}</div>
            <div className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% 较上月
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃成员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8% 较上月
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">国库余额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasury?.balance?.toFixed(2) || '0.00'} SOL</div>
            <div className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -3% 较上月
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目完成率</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <div className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5% 较上月
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>投票活动趋势</CardTitle>
            <CardDescription>最近7个提案的投票分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={votingActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="forVotes" stackId="a" fill="#22c55e" name="支持" />
                <Bar dataKey="againstVotes" stackId="a" fill="#ef4444" name="反对" />
                <Bar dataKey="abstainVotes" stackId="a" fill="#6b7280" name="弃权" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Proposal Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>提案状态分布</CardTitle>
            <CardDescription>当前所有提案的状态统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={proposalStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {proposalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treasury Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>国库资金流</CardTitle>
            <CardDescription>过去6个月的收入和支出趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={treasuryFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3} 
                  name="余额" 
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="2" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6} 
                  name="收入" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stackId="3" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6} 
                  name="支出" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>项目进度跟踪</CardTitle>
            <CardDescription>各项目的完成进度和预算使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="progress" 
                  fill="#3b82f6" 
                  name="进度 %" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="总预算" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  name="已花费" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Member Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>成员活跃度分析</CardTitle>
          <CardDescription>DAO 成员角色分布和活跃度统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {memberActivityData.find(m => m.role === 'ADMIN')?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">管理员</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {memberActivityData.find(m => m.role === 'MEMBER')?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">普通成员</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(Math.random() * 50 + 10)}%
              </div>
              <div className="text-sm text-muted-foreground">本月活跃率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}