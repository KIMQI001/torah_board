"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  HardDrive, 
  Cpu, 
  Wifi, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Power,
  Monitor,
  Server,
  Settings,
  RefreshCw
} from 'lucide-react';
import { MyNode, depinStore } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface NodeMonitorModalProps {
  node: MyNode;
  trigger: React.ReactNode;
}

export function NodeMonitorModal({ node, trigger }: NodeMonitorModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<MyNode>(node);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Update node data when modal opens
      const updatedNode = depinStore.getNode(node.id);
      if (updatedNode) {
        setCurrentNode(updatedNode);
      }
    }
  }, [isOpen, node.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate performance updates
    depinStore.simulateRealtimeUpdate();
    
    const updatedNode = depinStore.getNode(node.id);
    if (updatedNode) {
      setCurrentNode(updatedNode);
    }
    
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'syncing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <Power className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (value: number, type: 'cpu' | 'memory' | 'disk' | 'latency') => {
    if (type === 'latency') {
      if (value < 50) return 'text-green-500';
      if (value < 100) return 'text-yellow-500';
      return 'text-red-500';
    }
    
    if (value < 60) return 'text-green-500';
    if (value < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Monitor className="h-6 w-6" />
            </div>
            {currentNode.network} Node
            <Badge variant={currentNode.status === 'online' ? 'default' : 'secondary'}>
              <div className="flex items-center gap-1">
                {getStatusIcon(currentNode.status)}
                {currentNode.status.toUpperCase()}
              </div>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Monitoring node {currentNode.nodeId} in {currentNode.location}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center">
          <div />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        CPU Usage
                      </span>
                      <span className={`font-bold ${getPerformanceColor(currentNode.performance.cpuUsage, 'cpu')}`}>
                        {currentNode.performance.cpuUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ width: `${currentNode.performance.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Memory Usage
                      </span>
                      <span className={`font-bold ${getPerformanceColor(currentNode.performance.memoryUsage, 'memory')}`}>
                        {currentNode.performance.memoryUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500" 
                        style={{ width: `${currentNode.performance.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Disk Usage
                      </span>
                      <span className={`font-bold ${getPerformanceColor(currentNode.performance.diskUsage, 'disk')}`}>
                        {currentNode.performance.diskUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-500" 
                        style={{ width: `${currentNode.performance.diskUsage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Network Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className={`font-bold ${getPerformanceColor(currentNode.performance.networkLatency, 'latency')}`}>
                      {currentNode.performance.networkLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload Speed</span>
                    <span className="font-bold">{(currentNode.performance.bandwidthUp || 0).toFixed(1)} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Download Speed</span>
                    <span className="font-bold">{(currentNode.performance.bandwidthDown || 0).toFixed(1)} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-bold text-green-500">{currentNode.uptime}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getStatusColor(currentNode.status)}`}>
                      {currentNode.status === 'online' ? '✓' : currentNode.status === 'offline' ? '✗' : '⚡'}
                    </div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentNode.uptime}</div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{currentNode.earnings}</div>
                    <p className="text-sm text-muted-foreground">Daily Earnings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">${currentNode.totalEarned.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Earnings Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Earnings</span>
                    <span className="font-bold text-green-500">{currentNode.earnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-bold">${currentNode.totalEarned.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Running Since</span>
                    <span className="font-bold">{new Date(currentNode.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Active</span>
                    <span className="font-bold">
                      {Math.ceil((Date.now() - new Date(currentNode.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Daily Earnings</span>
                    <span className="font-bold">
                      ${(currentNode.totalEarned / Math.max(1, Math.ceil((Date.now() - new Date(currentNode.startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Projection</span>
                    <span className="font-bold text-green-500">
                      ${(parseFloat(currentNode.earnings.replace('$', '').replace('/day', '')) * 30).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Projection</span>
                    <span className="font-bold text-blue-500">
                      ${(parseFloat(currentNode.earnings.replace('$', '').replace('/day', '')) * 365).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>Last 30 days earnings trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end justify-between gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const height = Math.random() * 80 + 20; // Random height between 20-100%
                    return (
                      <div
                        key={i}
                        className="bg-blue-500 rounded-t-sm flex-1 opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                        title={`Day ${i + 1}: $${(height / 100 * parseFloat(currentNode.earnings.replace('$', '').replace('/day', ''))).toFixed(2)}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Hover over bars to see daily earnings
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hardware" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentNode.hardware.map((hw, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {hw.type === 'storage' && <HardDrive className="h-4 w-4" />}
                          {hw.type === 'cpu' && <Cpu className="h-4 w-4" />}
                          {hw.type === 'gpu' && <Cpu className="h-4 w-4" />}
                          {hw.type === 'memory' && <Activity className="h-4 w-4" />}
                          {hw.type === 'network' && <Wifi className="h-4 w-4" />}
                          {hw.type === 'sensor' && <Activity className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{hw.type}</h4>
                          <p className="text-sm text-muted-foreground">{hw.requirement}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${hw.cost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{hw.powerConsumption}W</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Node ID</span>
                  <span className="font-mono text-sm">{currentNode.nodeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-bold">{currentNode.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold">{currentNode.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentNode.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-bold">{currentNode.capacity}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Node Settings
                </CardTitle>
                <CardDescription>
                  Configure your node parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Node Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    defaultValue={currentNode.nodeId}
                    placeholder="Enter node name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    defaultValue={currentNode.location}
                    placeholder="Enter location"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-restart on failure</label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enable automatic restart</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Performance monitoring</label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enable performance alerts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Node
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Configuration
                </Button>
                <Button variant="destructive" className="w-full">
                  <Power className="h-4 w-4 mr-2" />
                  Shut Down Node
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}