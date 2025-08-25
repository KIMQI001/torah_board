"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, HardDrive, Cpu, Wifi, Activity, ExternalLink, Zap, Globe, Calculator, BarChart3, Map, Bell, RefreshCw, Plus, Monitor, ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { DePINProject, MyNode, depinStore, DEFAULT_DEPIN_PROJECTS, DEFAULT_MY_NODES } from '@/components/depin/depin-store';
import { NetworkDetailsModal } from '@/components/depin/network-details-modal';
import { NodeMonitorModal } from '@/components/depin/node-monitor-modal';
import { ROICalculatorModal } from '@/components/depin/roi-calculator-modal';
import { NetworkMapModal } from '@/components/depin/network-map-modal';
import { AddProjectModal } from '@/components/depin/add-project-modal';
import { AddNodeModal } from '@/components/depin/add-node-modal';

export default function DePINPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<DePINProject[]>([]);
  const [myNodes, setMyNodes] = useState<MyNode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

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
    
    setProjects(storeProjects.length > 0 ? storeProjects : DEFAULT_DEPIN_PROJECTS);
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
    setProjects(prev => [newProject, ...prev]);
    setNotifications(prev => [...prev, `Project "${newProject.name}" added successfully`]);
  };

  const handleAddNode = (nodeData: Omit<MyNode, 'id'>) => {
    const newNode = depinStore.addNode(nodeData);
    setMyNodes(prev => [newNode, ...prev]);
    setNotifications(prev => [...prev, `Node "${newNode.nodeId}" added successfully`]);
  };

  const handleJoinNetwork = (projectName: string) => {
    // 模拟加入网络的过程
    const nodeData: Omit<MyNode, 'id'> = {
      network: projectName,
      nodeId: `node_${Date.now()}`,
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
        uptime: 0,
        errorsLast24h: 0
      }
    };

    const newNode = depinStore.addNode(nodeData);
    setMyNodes(prev => [newNode, ...prev]);
    setNotifications(prev => [...prev, `Successfully joined ${projectName} network!`]);
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
              <Button size="sm" variant="outline" onClick={() => console.log('添加项目测试')}>
                <Plus className="h-4 w-4 mr-2" />
                添加项目
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => {
                const IconComponent = getCategoryIcon(project.category);
                return (
                  <div key={project.name} className="border rounded-lg p-4">
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
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-500">{project.apy} APY</p>
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
                        <Button size="sm" variant="outline" onClick={() => console.log('查看详情:', project.name)}>
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
              <Button size="sm" variant="outline" onClick={() => console.log('添加节点测试')}>
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
                    <div className="text-right">
                      <p className="font-bold text-green-500">{node.earnings}</p>
                      <p className={`text-xs ${getStatusColor(node.status)}`}>
                        {node.status.toUpperCase()}
                      </p>
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
                    <Button size="sm" variant="outline" onClick={() => console.log('Monitor节点:', node.nodeId)}>
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
    </div>
  );
}