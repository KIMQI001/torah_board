"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, HardDrive, Cpu, Wifi, Activity, ExternalLink, Zap, Globe, Calculator, BarChart3, Map, Bell, RefreshCw, Plus, Monitor, ChevronDown, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { DePINProject, MyNode, depinStore, DEFAULT_DEPIN_PROJECTS, DEFAULT_MY_NODES } from '@/components/depin/depin-store';
import { ROICalculatorModal } from '@/components/depin/roi-calculator-modal';
import { CustomModal, AddProjectForm, AddNodeForm } from '@/components/depin/custom-modal';

export default function DePINPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<DePINProject[]>([]);
  const [myNodes, setMyNodes] = useState<MyNode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    
    // Set up real-time data simulation
    const interval = setInterval(() => {
      depinStore.simulateRealtimeUpdate();
      setMyNodes(depinStore.getMyNodes());
    }, 30000); // Update every 30 seconds

    // Auto-clear old notifications
    const notificationInterval = setInterval(() => {
      setNotifications(prev => prev.length > 5 ? prev.slice(-3) : prev);
    }, 60000); // Clean up every minute

    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, []);

  const loadData = () => {
    // Use default data if store data is empty
    const storeProjects = depinStore.getProjects();
    const storeNodes = depinStore.getMyNodes();
    
    // 去重项目数据（基于ID和名称）
    const uniqueProjects = storeProjects.length > 0 ? 
      storeProjects.filter((project, index, arr) => 
        arr.findIndex(p => p.id === project.id || p.name === project.name) === index
      ) : DEFAULT_DEPIN_PROJECTS;
    
    setProjects(uniqueProjects);
    setMyNodes(storeNodes.length > 0 ? storeNodes : DEFAULT_MY_NODES);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    depinStore.simulateRealtimeUpdate();
    loadData();
    setIsRefreshing(false);
    setNotifications(prev => [...prev, `Data refreshed at ${new Date().toLocaleTimeString()}`]);
  };

  const handleAddProject = (projectData: Omit<DePINProject, 'id'>) => {
    const newProject = depinStore.addProject(projectData);
    // 直接从store重新加载数据，确保数据一致性
    setProjects(depinStore.getProjects());
    setNotifications(prev => [...prev, `Project "${newProject.name}" added successfully`]);
  };

  const handleAddNode = (nodeData: Omit<MyNode, 'id'>) => {
    const newNode = depinStore.addNode(nodeData);
    // 直接从store重新加载数据，确保数据一致性
    setMyNodes(depinStore.getMyNodes());
    // 通知已在调用处处理，这里不再重复
    return newNode;
  };

  const handleJoinNetwork = (projectName: string) => {
    // 模拟加入网络的过程
    const timestamp = Date.now();
    const shortId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const nodeData: Omit<MyNode, 'id'> = {
      network: projectName,
      nodeId: `AUTO-${shortId}`,  // 使用更清晰的自动生成ID格式
      type: 'Auto-generated',
      capacity: '1 TiB',
      earnings: '$25.00/day',
      status: 'syncing',
      uptime: '0%',
      location: 'Auto-detected',
      startDate: new Date().toISOString().split('T')[0],
      totalEarned: 0,
      hardware: [],
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 50,
        bandwidthUp: 0,
        bandwidthDown: 0
      }
    };

    const newNode = handleAddNode(nodeData);
    setNotifications(prev => [...prev, `Successfully joined ${projectName} network!`]);
  };

  const handleAddProjectSubmit = async (formData: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newProject = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        nodes: '0',
        capacity: '0 TiB', 
        rewards: '$0/day',
        apy: formData.apy + '%',
        status: 'active' as const,
        blockchain: formData.blockchain || 'Solana',
        tokenSymbol: formData.tokenSymbol || 'SOL',
        tokenPrice: 100,
        marketCap: '$0',
        volume24h: '$0',
        hardwareRequirement: [
          { type: 'storage', requirement: '1 TB SSD', cost: 200, powerConsumption: 10 }
        ],
        minInvestment: 1000,
        roiPeriod: 12,
        geographicFocus: ['Global'],
        riskLevel: 'medium' as const
      };
      
      handleAddProject(newProject);
      setShowAddProjectModal(false);
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNodeSubmit = async (formData: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 解析多个节点ID（支持空格或逗号分隔）
      const nodeIds = formData.nodeIds
        .split(/[\s,]+/)  // 按空格或逗号分割
        .map(id => id.trim())  // 去除空白
        .filter(id => id.length > 0);  // 过滤空值
      
      // 为每个节点ID创建节点
      let addedCount = 0;
      for (const nodeId of nodeIds) {
        const newNode = {
          network: formData.network,
          nodeId: nodeId,  // 使用用户输入的节点ID
          type: formData.type,
          capacity: formData.capacity || 'Querying...',  // 如果没有输入容量，显示查询中
          earnings: '$' + (Math.random() * 50 + 10).toFixed(2) + '/day',
          status: 'online' as const,
          uptime: '99.2%',
          location: formData.location || 'Auto-detected',
          startDate: new Date().toISOString().split('T')[0],
          totalEarned: Math.random() * 1000,
          hardware: [
            { type: formData.hardwareType, requirement: formData.capacity || 'Auto', cost: 1000, powerConsumption: 100 }
          ],
          performance: {
            cpuUsage: Math.random() * 50 + 30,
            memoryUsage: Math.random() * 40 + 40,
            diskUsage: Math.random() * 60 + 20,
            networkLatency: Math.random() * 20 + 10,
            bandwidthUp: Math.random() * 50 + 10,
            bandwidthDown: Math.random() * 100 + 50
          },
          ...(formData.monitorUrl && { monitorUrl: formData.monitorUrl })
        };
        
        const addedNode = handleAddNode(newNode);
        setNotifications(prev => [...prev, `节点 "${addedNode.nodeId}" 添加成功`]);
        addedCount++;
        
        // 如果没有输入容量，模拟API查询更新容量
        if (!formData.capacity && addedNode) {
          // 模拟异步API查询
          setTimeout(() => {
            const queriedCapacity = `${Math.floor(Math.random() * 100 + 10)} TiB`;
            depinStore.updateNode(addedNode.id, { 
              capacity: queriedCapacity,
              hardware: [
                { type: formData.hardwareType, requirement: queriedCapacity, cost: 1000, powerConsumption: 100 }
              ]
            });
            // 刷新UI
            setMyNodes(depinStore.getMyNodes());
            setNotifications(prev => [...prev, `节点 ${nodeId} 容量已更新: ${queriedCapacity}`]);
          }, 2000 + Math.random() * 2000); // 2-4秒后更新
        }
        
        // 如果有多个节点，添加一个小延迟避免ID冲突
        if (nodeIds.length > 1 && addedCount < nodeIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // 添加批量成功通知
      if (nodeIds.length > 1) {
        setNotifications(prev => [...prev, `成功添加 ${nodeIds.length} 个节点`]);
      }
      
      setShowAddNodeModal(false);
    } catch (error) {
      console.error('Error adding node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`确定要删除项目 "${projectName}" 吗？此操作不可撤销。`)) {
      const success = depinStore.removeProject(projectId);
      if (success) {
        // 直接从store重新加载数据，确保数据一致性
        setProjects(depinStore.getProjects());
        setNotifications(prev => [...prev, `项目 "${projectName}" 已删除`]);
      }
    }
  };

  const handleDeleteNode = (nodeId: string, nodeName: string) => {
    if (confirm(`确定要删除节点 "${nodeName}" 吗？此操作不可撤销。`)) {
      const success = depinStore.removeNode(nodeId);
      if (success) {
        // 直接从store重新加载数据，确保数据一致性
        setMyNodes(depinStore.getMyNodes());
        setNotifications(prev => [...prev, `节点 "${nodeName}" 已删除`]);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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
    switch (status) {
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

  const totalNodes = myNodes.length;
  const totalDailyEarnings = myNodes.reduce((sum, node) => {
    const earnings = parseFloat(node.earnings.replace('$', '').replace('/day', ''));
    return sum + earnings;
  }, 0);

  const onlineNodes = myNodes.filter(node => node.status === 'online').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('depin.title')}</h1>
          <p className="text-muted-foreground">
            {t('depin.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => {
            if (confirm('确定要清除所有本地数据吗？这将删除所有添加的项目和节点。')) {
              localStorage.removeItem('depin-projects');
              localStorage.removeItem('depin-nodes');
              window.location.reload();
            }
          }}>
            清除数据
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('depin.totalNetworks')}</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
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
            <div className="text-2xl font-bold">${totalDailyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('depin.dailyRewards')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${myNodes.reduce((sum, node) => sum + node.totalEarned, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('depin.topProjects')}</CardTitle>
                <CardDescription>
                  Leading decentralized infrastructure networks
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddProjectModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加项目
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project, index) => {
                const IconComponent = getCategoryIcon(project.category);
                // 使用更安全的key生成策略
                const safeKey = project.id || `${project.name}-${index}`;
                return (
                  <div key={safeKey} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-500">{project.apy} APY</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteProject(project.id || project.name, project.name)}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Nodes</p>
                        <p className="font-medium">{project.nodes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="font-medium">{project.capacity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rewards</p>
                        <p className="font-medium">{project.rewards}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                        ACTIVE
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const details = `项目详情：
名称: ${project.name}
类别: ${project.category}
描述: ${project.description}
节点数: ${project.nodes}
容量: ${project.capacity}
奖励: ${project.rewards}
APY: ${project.apy}
区块链: ${project.blockchain}
代币: ${project.tokenSymbol}
代币价格: $${project.tokenPrice}
市值: ${project.marketCap}
24h交易量: ${project.volume24h}
最小投资: $${project.minInvestment}
投资回收期: ${project.roiPeriod}个月
风险等级: ${project.riskLevel}`;
                          alert(details);
                        }}>
                          查看详情
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinNetwork(project.name)}
                        >
                          加入网络
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
            <div className="space-y-4">
              {myNodes.map((node) => (
                <div key={node.nodeId} className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
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
                      <p className="text-sm font-medium">{node.capacity}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Uptime: {node.uptime}
                    </p>
                    <Button 
                      size="sm" 
                      variant={node.monitorUrl ? "default" : "outline"}
                      onClick={() => {
                        if (node.monitorUrl) {
                          // 如果有监控链接，在新标签页打开
                          window.open(node.monitorUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          // 否则显示节点详情
                          const monitorInfo = `节点监控信息：
节点ID: ${node.nodeId}
网络: ${node.network}
类型: ${node.type}
状态: ${node.status}
在线时间: ${node.uptime}
位置: ${node.location}
容量: ${node.capacity}
收益: ${node.earnings}
总收益: $${node.totalEarned.toFixed(2)}
开始日期: ${node.startDate}

性能指标:
CPU使用率: ${node.performance.cpuUsage.toFixed(1)}%
内存使用率: ${node.performance.memoryUsage.toFixed(1)}%
磁盘使用率: ${node.performance.diskUsage.toFixed(1)}%
网络延迟: ${node.performance.networkLatency.toFixed(0)}ms
上传带宽: ${(node.performance.bandwidthUp || 0).toFixed(1)} Mbps
下载带宽: ${(node.performance.bandwidthDown || 0).toFixed(1)} Mbps`;
                        alert(monitorInfo);
                      }
                    }}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Monitor
                    </Button>
                  </div>
                </div>
              ))}

              {myNodes.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Network className="h-12 w-12 mx-auto mb-4" />
                  <p>No active nodes yet</p>
                  <p className="text-sm mb-4">Join a DePIN network to start earning rewards</p>
                  <div className="flex gap-2 justify-center">
                    <ROICalculatorModal trigger={
                      <Button variant="outline">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate ROI
                      </Button>
                    } />
                    <Button>
                      <Zap className="h-4 w-4 mr-2" />
                      Browse Networks
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                count: projects.filter(p => p.category === 'storage').length
              },
              {
                category: 'computing',
                icon: Cpu,
                color: 'green',
                title: t('depin.computing'),
                description: 'Distributed computing and GPU resources',
                count: projects.filter(p => p.category === 'computing').length
              },
              {
                category: 'wireless',
                icon: Wifi,
                color: 'purple',
                title: t('depin.wireless'),
                description: 'Wireless connectivity and IoT infrastructure',
                count: projects.filter(p => p.category === 'wireless').length
              },
              {
                category: 'sensors',
                icon: Activity,
                color: 'orange',
                title: t('depin.sensors'),
                description: 'Environmental sensors and data collection',
                count: projects.filter(p => p.category === 'sensors').length
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
              {notifications.slice(-3).map((notification, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                  {notification}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Modals */}
      <CustomModal 
        isOpen={showAddProjectModal} 
        onClose={() => setShowAddProjectModal(false)}
        title="创建新项目"
      >
        <AddProjectForm 
          onSubmit={handleAddProjectSubmit}
          onCancel={() => setShowAddProjectModal(false)}
          isLoading={isSubmitting}
        />
      </CustomModal>

      <CustomModal 
        isOpen={showAddNodeModal} 
        onClose={() => setShowAddNodeModal(false)}
        title="添加新节点"
      >
        <AddNodeForm 
          onSubmit={handleAddNodeSubmit}
          onCancel={() => setShowAddNodeModal(false)}
          isLoading={isSubmitting}
          projects={projects}
        />
      </CustomModal>
    </div>
  );
}