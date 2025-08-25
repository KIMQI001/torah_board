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
  ExternalLink, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DePINProject, HardwareSpec, ROICalculation, depinStore } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface NetworkDetailsModalProps {
  project: DePINProject;
  trigger: React.ReactNode;
}

export function NetworkDetailsModal({ project, trigger }: NetworkDetailsModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('San Francisco');
  const [roiData, setRoiData] = useState<ROICalculation | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const locations = ['San Francisco', 'New York', 'Austin', 'Denver', 'Los Angeles', 'Chicago'];

  useEffect(() => {
    if (isOpen) {
      calculateROI();
    }
  }, [isOpen, selectedLocation]);

  const calculateROI = () => {
    try {
      const roi = depinStore.calculateROI(project.id, selectedLocation);
      setRoiData(roi);
    } catch (error) {
      console.error('ROI calculation error:', error);
    }
  };

  const handleJoinNetwork = async () => {
    setIsJoining(true);
    // Simulate network joining process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add a new node for this network
    const newNode = {
      id: `node-${project.id}-${Date.now()}`,
      network: project.name,
      nodeId: `node-${Math.random().toString(36).substr(2, 9)}`,
      type: `${project.name} Node`,
      capacity: 'Pending Setup',
      earnings: '$0.00/day',
      status: 'offline' as const,
      uptime: '0%',
      location: selectedLocation,
      startDate: new Date().toISOString().split('T')[0],
      totalEarned: 0,
      hardware: project.hardwareRequirement,
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        bandwidthUp: 0,
        bandwidthDown: 0
      }
    };
    
    depinStore.addNode(newNode);
    setIsJoining(false);
    setIsOpen(false);
  };

  const getCategoryIcon = () => {
    switch (project.category) {
      case 'storage': return HardDrive;
      case 'computing': return Cpu;
      case 'wireless': return Wifi;
      case 'sensors': return Activity;
      default: return Activity;
    }
  };

  const CategoryIcon = getCategoryIcon();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <CategoryIcon className="h-6 w-6" />
            </div>
            {project.name}
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('dao.overview')}</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
            <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
            <TabsTrigger value="network">Network Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token Price</span>
                    <span className="font-bold">${project.tokenPrice.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Cap</span>
                    <span className="font-bold">{project.marketCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-bold">{project.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-bold text-green-500">{project.apy}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Network Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Nodes</span>
                    <span className="font-bold">{project.nodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Capacity</span>
                    <span className="font-bold">{project.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Rewards</span>
                    <span className="font-bold">{project.rewards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blockchain</span>
                    <Badge variant="outline">{project.blockchain}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.geographicFocus.map((region) => (
                    <Badge key={region} variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {region}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hardware" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Requirements</CardTitle>
                <CardDescription>
                  Minimum specifications needed to operate a node
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.hardwareRequirement.map((hw, index) => (
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
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Hardware Cost</span>
                    <span>${project.hardwareRequirement.reduce((sum, hw) => sum + hw.cost, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Total Power Consumption</span>
                    <span>{project.hardwareRequirement.reduce((sum, hw) => sum + hw.powerConsumption, 0)}W</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ROI Calculator
                </CardTitle>
                <CardDescription>
                  Calculate potential returns based on location and investment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {roiData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Hardware Cost</p>
                        <p className="text-2xl font-bold">${roiData.hardwareCost.toLocaleString()}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Monthly Operating Cost</p>
                        <p className="text-2xl font-bold">${roiData.monthlyCost}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Est. Monthly Reward</p>
                        <p className="text-2xl font-bold text-green-500">
                          ${roiData.estimatedMonthlyReward.toFixed(2)}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">ROI Period</p>
                        <p className="text-2xl font-bold">{roiData.roiMonths.toFixed(1)} months</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <h4 className="font-semibold">Annual ROI</h4>
                      </div>
                      <p className="text-3xl font-bold text-green-500">
                        {roiData.annualROI > 0 ? '+' : ''}{roiData.annualROI.toFixed(1)}%
                      </p>
                    </div>

                    {roiData.riskFactors.length > 0 && (
                      <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-semibold">Risk Factors</h4>
                        </div>
                        <ul className="space-y-1">
                          {roiData.riskFactors.map((risk, index) => (
                            <li key={index} className="text-sm">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Node Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>North America</span>
                      <span className="font-bold">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Europe</span>
                      <span className="font-bold">32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Asia</span>
                      <span className="font-bold">18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other</span>
                      <span className="font-bold">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Network Uptime</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-bold">99.8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Avg Response Time</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-bold">45ms</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Sessions</span>
                      <span className="font-bold">2.1M</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Processed</span>
                      <span className="font-bold">847 TB/day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {project.website && (
              <Card>
                <CardHeader>
                  <CardTitle>External Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild>
                    <a href={project.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Official Website
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={handleJoinNetwork} disabled={isJoining}>
            {isJoining ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Joining Network...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('depin.joinNetwork')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}