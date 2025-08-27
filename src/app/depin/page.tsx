"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, HardDrive, Cpu, Wifi, Activity, ExternalLink, Zap, Globe, Calculator, BarChart3, Map, Bell, RefreshCw, Plus, Monitor, ChevronDown, Trash2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/AuthContext";
import { WalletButton } from "@/components/wallet/WalletButton";
import { apiDePINStore, type ApiDePINStore } from '@/components/depin/api-depin-store';
import { type DePINProject, type UserNode, projectsApi } from '@/lib/api';
import { CustomModal, AddNodeForm } from '@/components/depin/custom-modal';
import { AddProjectModal } from '@/components/depin/AddProjectModal';

export default function DePINPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user, signOut } = useAuth();
  const [storeState, setStoreState] = useState<ApiDePINStore>(apiDePINStore.getState());
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    // Mark client as ready to prevent hydration issues
    setIsClientReady(true);
    
    // Subscribe to store updates
    const unsubscribe = apiDePINStore.subscribe(() => {
      setStoreState(apiDePINStore.getState());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Load initial data when authentication state changes
    if (isAuthenticated) {
      apiDePINStore.refreshAll();
    }
  }, [isAuthenticated]);

  // 自动刷新 Filecoin 收益
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const refreshFilecoinEarnings = async () => {
      // 只刷新 Filecoin 节点数据
      const filecoinNodes = storeState.nodes.filter(node => node.network.includes('Filecoin'));
      if (filecoinNodes.length > 0) {
        await apiDePINStore.refreshFilecoinEarnings();
        setNotifications(prev => [
          ...prev, 
          `Filecoin 收益已刷新 - ${new Date().toLocaleTimeString()}`
        ]);
      }
    };
    
    // 每 5 分钟刷新一次 Filecoin 收益
    const interval = setInterval(refreshFilecoinEarnings, 5 * 60 * 1000);
    
    // 立即执行一次
    refreshFilecoinEarnings();
    
    return () => clearInterval(interval);
  }, [isAuthenticated, storeState.nodes.length]);


  const handleRefresh = async () => {
    await apiDePINStore.refreshAll();
    setNotifications(prev => [...prev, `Data refreshed at ${new Date().toLocaleTimeString()}`]);
  };

  const handleTriggerCapacityUpdate = async () => {
    const result = await apiDePINStore.triggerCapacityUpdate();
    setNotifications(prev => [...prev, result.message]);
  };

  const handleDisconnectWallet = async () => {
    try {
      await signOut();
      setNotifications(prev => [...prev, 'Wallet disconnected successfully']);
    } catch (error) {
      setNotifications(prev => [...prev, 'Failed to disconnect wallet']);
    }
  };

  const handleAddProjectSubmit = async (projectData: any) => {
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setNotifications(prev => [...prev, '请先登录后再创建项目']);
      return { success: false, message: '请先登录后再创建项目' };
    }

    try {
      const response = await projectsApi.createProject(projectData);
      
      if (response.success) {
        setNotifications(prev => [...prev, '项目创建成功！']);
        // Refresh projects list
        await apiDePINStore.refreshProjects();
        return { success: true, message: '项目创建成功' };
      } else {
        const errorMsg = response.error || '项目创建失败';
        setNotifications(prev => [...prev, errorMsg]);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      let errorMessage = '项目创建失败：网络错误';
      
      // 提供更具体的错误信息
      if (error.message?.includes('No token provided')) {
        errorMessage = '认证失效，请重新登录';
      } else if (error.message?.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络';
      } else if (error.message) {
        errorMessage = `项目创建失败：${error.message}`;
      }
      
      setNotifications(prev => [...prev, errorMessage]);
      return { success: false, message: errorMessage };
    }
  };

  const handleAddNodeSubmit = async (formData: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      // Parse multiple node IDs (support space or comma separation)
      const nodeIds = formData.nodeIds
        .split(/[\s,]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      const hardware = formData.hardwareType ? [{
        type: formData.hardwareType,
        requirement: formData.capacity || 'Auto',
        cost: 1000,
        powerConsumption: 100
      }] : undefined;

      const result = await apiDePINStore.createNodes({
        nodeIds,
        projectId: formData.projectId,
        type: formData.type,
        capacity: formData.capacity || undefined,
        location: formData.location || undefined,
        monitorUrl: formData.monitorUrl || undefined,
        hardware
      });

      if (result.success) {
        setNotifications(prev => [...prev, result.message]);
        setShowAddNodeModal(false);
      } else {
        setNotifications(prev => [...prev, `Failed to add nodes: ${result.message}`]);
      }
    } catch (error) {
      console.error('Error adding nodes:', error);
      setNotifications(prev => [...prev, 'Error adding nodes']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async (nodeId: string, nodeName: string) => {
    if (confirm(`确定要删除节点 "${nodeName}" 吗？此操作不可撤销。`)) {
      const success = await apiDePINStore.deleteNode(nodeId);
      if (success) {
        setNotifications(prev => [...prev, `节点 "${nodeName}" 已删除`]);
      } else {
        setNotifications(prev => [...prev, `删除节点 "${nodeName}" 失败`]);
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`确定要删除项目 "${projectName}" 吗？此操作不可撤销。`)) {
      const success = await apiDePINStore.deleteProject(projectId);
      if (success) {
        setNotifications(prev => [...prev, `项目 "${projectName}" 已删除`]);
      } else {
        setNotifications(prev => [...prev, `删除项目 "${projectName}" 失败`]);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "storage":
        return HardDrive;
      case "computing":
        return Cpu;
      case "wireless":
        return Wifi;
      case "sensors":
        return Activity;
      default:
        return Network;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      case "syncing":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  // Show loading spinner until client is ready
  if (!isClientReady) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication prompt if not connected
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Network className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">{t('depin.title')}</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your wallet to access DePIN projects and manage your nodes
          </p>
          <WalletButton variant="default" className="min-w-[140px]" />
          {storeState.errors.auth && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{storeState.errors.auth}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalNodes = storeState.nodes.length;
  const onlineNodes = storeState.nodes.filter(node => node.status === 'online').length;
  const totalDailyEarnings = storeState.nodes.reduce((sum, node) => {
    // Extract number from earnings like "50.25 FIL/day" or "24.80 HNT/day"
    const match = node.earnings.match(/^([\d.]+)/);
    const earnings = match ? parseFloat(match[1]) : 0;
    return sum + earnings;
  }, 0);
  const totalEarned = storeState.nodes.reduce((sum, node) => sum + node.totalEarned, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('depin.title')}</h1>
          <p className="text-muted-foreground">
            {t('depin.subtitle')}
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Connected: {storeState.user?.walletAddress?.substring(0, 8)}...
            {storeState.user?.walletAddress?.substring(-4)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={apiDePINStore.isLoading()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${apiDePINStore.isLoading() ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={handleTriggerCapacityUpdate}>
            <Zap className="h-4 w-4 mr-2" />
            Update Capacity
          </Button>
          <Button variant="outline" onClick={handleDisconnectWallet}>
            Disconnect
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {apiDePINStore.isLoading() && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading data from backend...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {Object.values(storeState.errors).some(error => error) && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2">
              {Object.entries(storeState.errors).map(([key, error]) => 
                error ? (
                  <div key={key} className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{key}: {error}</span>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('depin.totalNetworks')}</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeState.projects.length}</div>
            <p className="text-xs text-muted-foreground">Available networks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('depin.activeNodes')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNodes}</div>
            <p className="text-xs text-muted-foreground">{onlineNodes} online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('depin.totalRewards')}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDailyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('depin.dailyRewards')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('depin.topProjects')}</CardTitle>
                <CardDescription>
                  Leading decentralized infrastructure networks
                </CardDescription>
              </div>
              {isAuthenticated && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowAddProjectModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加项目
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {storeState.projects
                .sort((a, b) => {
                  // 将 Filecoin 排在第一位，Hivemapper 排在第二位
                  if (a.name.includes('Filecoin')) return -1;
                  if (b.name.includes('Filecoin')) return 1;
                  if (a.name.includes('Hivemapper')) return -1;
                  if (b.name.includes('Hivemapper')) return 1;
                  return 0;
                })
                .map((project, index) => {
                const IconComponent = getCategoryIcon(project.category);
                // Find project capacity and earnings from dashboard stats
                const projectStats = storeState.dashboardStats?.nodesByProject?.find(
                  p => p.projectName === project.name
                );
                
                // 修正容量单位显示（特别是 Filecoin）
                let projectCapacity = projectStats?.totalCapacity || '0 TiB';
                if (project.name.includes('Filecoin') && projectCapacity) {
                  // 将 TiB 转换为 PiB 显示（如果值大于 1024）
                  const match = projectCapacity.match(/(\d+\.?\d*)\s*(\w+)/);
                  if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2];
                    if (unit === 'TiB' && value > 1024) {
                      projectCapacity = `${(value / 1024).toFixed(2)} PiB`;
                    }
                  }
                }
                
                const nodeCount = projectStats?.nodeCount || 0;
                
                // 计算每个项目的日收益（从节点数据中聚合）
                const projectNodes = storeState.nodes.filter(node => 
                  node.network.includes(project.name.split(' ')[0]) || project.name.includes(node.network)
                );
                const dailyEarnings = projectNodes.reduce((sum, node) => {
                  const match = node.earnings.match(/^([\d.]+)/);
                  return sum + (match ? parseFloat(match[1]) : 0);
                }, 0);
                
                return (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground break-words overflow-hidden">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-500">
                            {dailyEarnings.toFixed(2)} {project.tokenSymbol}/day
                          </p>
                        </div>
                        {isAuthenticated && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Token</p>
                        <p className="font-medium">{project.tokenSymbol}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">My Nodes</p>
                        <p className="font-medium">{nodeCount} nodes</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Capacity</p>
                        <p className="font-medium text-blue-600">{projectCapacity}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                        {project.status.toUpperCase()}
                      </span>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (project.websiteUrl) {
                              window.open(project.websiteUrl, '_blank');
                            } else {
                              const details = `项目详情：
名称: ${project.name}
类别: ${project.category}
描述: ${project.description}
区块链: ${project.blockchain}
代币: ${project.tokenSymbol} ($${project.tokenPrice})
市值: ${project.marketCap}
24h交易量: ${project.volume24h}
APY: ${project.apy}
最小投资: $${project.minInvestment}
投资回收期: ${project.roiPeriod}个月
风险等级: ${project.riskLevel}`;
                              alert(details);
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {storeState.projects.length === 0 && !storeState.loading.projects && (
                <div className="text-center text-muted-foreground py-8">
                  <Network className="h-12 w-12 mx-auto mb-4" />
                  <p>No projects available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Nodes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('depin.myNodes')}</CardTitle>
                <CardDescription>
                  Your active DePIN node operations
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddNodeModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加节点
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {storeState.nodes.map((node) => (
                <div key={node.id} className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{node.network}</h3>
                      <p className="text-sm text-muted-foreground">{node.type}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="text-right">
                        <p className="font-bold text-green-500">{node.earnings}</p>
                        <p className={`text-xs ${getStatusColor(node.status)}`}>
                          {node.status.toUpperCase()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteNode(node.id, `${node.network} - ${node.nodeId}`)}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Node ID</p>
                      <p className="text-sm font-medium">{node.nodeId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="text-sm font-medium">
                        {node.capacity === null || !node.capacity ? 'Querying...' : (() => {
                          // 对 Filecoin 节点的容量进行单位转换
                          if (node.network.includes('Filecoin') && node.capacity) {
                            const match = node.capacity.match(/(\d+\.?\d*)\s*(\w+)/);
                            if (match) {
                              const value = parseFloat(match[1]);
                              const unit = match[2];
                              
                              // 将 TiB 转换为 PiB 显示（如果值大于等于 1024）
                              if (unit === 'TiB' && value >= 1024) {
                                return `${(value / 1024).toFixed(2)} PiB`;
                              }
                              // 将 GiB 转换为 PiB 显示（如果值大于等于 1048576）
                              if (unit === 'GiB' && value >= 1048576) {
                                return `${(value / 1048576).toFixed(2)} PiB`;
                              }
                            }
                          }
                          return node.capacity;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Uptime: {node.uptime} | Total: {node.totalEarned.toFixed(2)}
                    </p>
                    <Button 
                      size="sm" 
                      variant={node.monitorUrl ? "default" : "outline"}
                      onClick={() => {
                        if (node.monitorUrl) {
                          window.open(node.monitorUrl, '_blank');
                        } else {
                          const monitorInfo = `节点监控信息：
节点ID: ${node.nodeId}
网络: ${node.network}
类型: ${node.type}
状态: ${node.status}
在线时间: ${node.uptime}
位置: ${node.location}
容量: ${node.capacity}
收益: ${node.earnings}
总收益: ${node.totalEarned.toFixed(2)}
开始日期: ${node.startDate}

${node.performance ? `性能指标:
CPU使用率: ${node.performance.cpuUsage.toFixed(1)}%
内存使用率: ${node.performance.memoryUsage.toFixed(1)}%
磁盘使用率: ${node.performance.diskUsage.toFixed(1)}%
网络延迟: ${node.performance.networkLatency.toFixed(0)}ms` : '暂无性能数据'}`;
                          alert(monitorInfo);
                        }
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Monitor
                    </Button>
                  </div>
                </div>
              ))}

              {storeState.nodes.length === 0 && !storeState.loading.nodes && (
                <div className="text-center text-muted-foreground py-8">
                  <Network className="h-12 w-12 mx-auto mb-4" />
                  <p>No active nodes yet</p>
                  <p className="text-sm mb-4">Add nodes to start earning rewards</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Network Categories</CardTitle>
          <CardDescription>
            Explore different types of decentralized infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                category: 'storage',
                icon: HardDrive,
                color: 'blue',
                title: t('depin.storage'),
                description: 'Decentralized file storage and data availability',
                count: storeState.projects.filter(p => p.category.toLowerCase() === 'storage').length
              },
              {
                category: 'computing',
                icon: Cpu,
                color: 'green',
                title: t('depin.computing'),
                description: 'Distributed computing and GPU resources',
                count: storeState.projects.filter(p => p.category.toLowerCase() === 'computing').length
              },
              {
                category: 'wireless',
                icon: Wifi,
                color: 'purple',
                title: t('depin.wireless'),
                description: 'Wireless connectivity and IoT infrastructure',
                count: storeState.projects.filter(p => p.category.toLowerCase() === 'wireless').length
              },
              {
                category: 'sensors',
                icon: Activity,
                color: 'orange',
                title: t('depin.sensors'),
                description: 'Environmental sensors and data collection',
                count: storeState.projects.filter(p => p.category.toLowerCase() === 'sensors').length
              }
            ].map(({ category, icon: Icon, color, title, description, count }) => (
              <div key={category} className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                    <Icon className={`h-5 w-5 text-${color}-500`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{count} networks</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              System Notifications
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setNotifications([])}
                className="ml-auto"
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(-5).map((notification, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                  {notification}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Node Modal */}
      <CustomModal 
        isOpen={showAddNodeModal} 
        onClose={() => setShowAddNodeModal(false)}
        title="添加新节点"
      >
        <AddNodeForm 
          onSubmit={handleAddNodeSubmit}
          onCancel={() => setShowAddNodeModal(false)}
          isLoading={isSubmitting}
          projects={storeState.projects.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            nodes: '0',
            capacity: '0',
            rewards: '$0/day',
            apy: p.apy,
            status: 'active' as const,
            blockchain: p.blockchain,
            tokenSymbol: p.tokenSymbol,
            tokenPrice: p.tokenPrice,
            marketCap: p.marketCap,
            volume24h: p.volume24h,
            hardwareRequirement: [],
            minInvestment: p.minInvestment,
            roiPeriod: p.roiPeriod,
            geographicFocus: [],
            riskLevel: p.riskLevel as 'low' | 'medium' | 'high'
          }))}
        />
      </CustomModal>

      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onSubmit={handleAddProjectSubmit}
      />
    </div>
  );
}