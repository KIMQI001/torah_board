"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Globe, 
  Activity, 
  TrendingUp,
  Users,
  Zap,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { DePINProject, MyNode, depinStore } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface NetworkMapModalProps {
  trigger: React.ReactNode;
}

interface NodeLocation {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  earnings: number;
  status: 'online' | 'offline' | 'syncing';
  projects: string[];
}

export function NetworkMapModal({ trigger }: NetworkMapModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<NodeLocation[]>([]);
  const [projects, setProjects] = useState<DePINProject[]>([]);

  // Mock node locations data
  const mockLocations: NodeLocation[] = [
    {
      id: 'sf',
      city: 'San Francisco',
      country: 'United States',
      lat: 37.7749,
      lng: -122.4194,
      count: 2847,
      earnings: 125600,
      status: 'online',
      projects: ['filecoin', 'helium', 'render']
    },
    {
      id: 'ny',
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lng: -74.0060,
      count: 1923,
      earnings: 89400,
      status: 'online',
      projects: ['filecoin', 'helium', 'dimo']
    },
    {
      id: 'london',
      city: 'London',
      country: 'United Kingdom',
      lat: 51.5074,
      lng: -0.1278,
      count: 1456,
      earnings: 67800,
      status: 'online',
      projects: ['filecoin', 'akash']
    },
    {
      id: 'berlin',
      city: 'Berlin',
      country: 'Germany',
      lat: 52.5200,
      lng: 13.4050,
      count: 987,
      earnings: 45600,
      status: 'online',
      projects: ['helium', 'akash']
    },
    {
      id: 'tokyo',
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6762,
      lng: 139.6503,
      count: 1234,
      earnings: 56700,
      status: 'online',
      projects: ['render', 'filecoin']
    },
    {
      id: 'singapore',
      city: 'Singapore',
      country: 'Singapore',
      lat: 1.3521,
      lng: 103.8198,
      count: 678,
      earnings: 34500,
      status: 'online',
      projects: ['akash', 'helium']
    },
    {
      id: 'sydney',
      city: 'Sydney',
      country: 'Australia',
      lat: -33.8688,
      lng: 151.2093,
      count: 543,
      earnings: 28900,
      status: 'online',
      projects: ['filecoin', 'helium']
    },
    {
      id: 'toronto',
      city: 'Toronto',
      country: 'Canada',
      lat: 43.6532,
      lng: -79.3832,
      count: 789,
      earnings: 42300,
      status: 'online',
      projects: ['hivemapper', 'dimo']
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setProjects(depinStore.getProjects());
      setLocations(mockLocations);
    }
  }, [isOpen]);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || location.projects.some(projectId => {
      const project = projects.find(p => p.id === projectId);
      return project?.category === selectedCategory;
    });
    
    const matchesRegion = selectedRegion === 'all' || 
                         (selectedRegion === 'americas' && ['United States', 'Canada'].includes(location.country)) ||
                         (selectedRegion === 'europe' && ['United Kingdom', 'Germany'].includes(location.country)) ||
                         (selectedRegion === 'asia' && ['Japan', 'Singapore'].includes(location.country)) ||
                         (selectedRegion === 'oceania' && location.country === 'Australia');
    
    return matchesSearch && matchesCategory && matchesRegion;
  });

  const getNodeSizeClass = (count: number) => {
    if (count > 2000) return 'w-6 h-6';
    if (count > 1000) return 'w-5 h-5';
    if (count > 500) return 'w-4 h-4';
    return 'w-3 h-3';
  };

  const getNodeColorClass = (count: number) => {
    if (count > 2000) return 'bg-green-500';
    if (count > 1000) return 'bg-blue-500';
    if (count > 500) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const totalNodes = filteredLocations.reduce((sum, loc) => sum + loc.count, 0);
  const totalEarnings = filteredLocations.reduce((sum, loc) => sum + loc.earnings, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Globe className="h-6 w-6" />
            </div>
            Global DePIN Network Map
          </DialogTitle>
          <DialogDescription>
            Explore the global distribution of DePIN nodes and infrastructure
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totalNodes.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Active Nodes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{filteredLocations.length}</p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">${(totalEarnings / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Daily Rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Networks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">World Map</TabsTrigger>
            <TabsTrigger value="list">Location List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option value="storage">Storage</option>
                <option value="computing">Computing</option>
                <option value="wireless">Wireless</option>
                <option value="sensors">Sensors</option>
              </select>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="all">All Regions</option>
                <option value="americas">Americas</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="oceania">Oceania</option>
              </select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Global Node Distribution</CardTitle>
                <CardDescription>Interactive map showing DePIN node locations worldwide</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simplified world map visualization */}
                <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg h-96 overflow-hidden">
                  {/* World map background (simplified representation) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-800 dark:to-green-800 opacity-30" />
                  
                  {/* Continents (simplified shapes) */}
                  <div className="absolute top-20 left-20 w-32 h-24 bg-green-300 dark:bg-green-600 rounded-2xl opacity-60" title="North America" />
                  <div className="absolute top-32 left-40 w-20 h-32 bg-green-300 dark:bg-green-600 rounded-xl opacity-60" title="South America" />
                  <div className="absolute top-16 left-72 w-40 h-28 bg-green-300 dark:bg-green-600 rounded-lg opacity-60" title="Europe & Africa" />
                  <div className="absolute top-24 right-20 w-48 h-32 bg-green-300 dark:bg-green-600 rounded-2xl opacity-60" title="Asia" />
                  <div className="absolute bottom-16 right-32 w-24 h-16 bg-green-300 dark:bg-green-600 rounded-xl opacity-60" title="Australia" />
                  
                  {/* Node markers */}
                  {filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className={`absolute rounded-full ${getNodeSizeClass(location.count)} ${getNodeColorClass(location.count)} 
                        cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all
                        shadow-lg border-2 border-white dark:border-gray-800`}
                      style={{
                        // Simplified positioning based on approximate coordinates
                        left: `${Math.max(10, Math.min(90, ((location.lng + 180) / 360) * 100))}%`,
                        top: `${Math.max(10, Math.min(90, ((90 - location.lat) / 180) * 100))}%`
                      }}
                      title={`${location.city}, ${location.country} - ${location.count} nodes`}
                    />
                  ))}
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
                    <h4 className="font-semibold mb-2 text-sm">Node Density</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>2000+ nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span>1000-2000 nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span>500-1000 nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                        <span>&lt;500 nodes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Node Locations</CardTitle>
                <CardDescription>Detailed list of all active node locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredLocations.map((location) => (
                    <div key={location.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getNodeColorClass(location.count)}`} />
                          <div>
                            <h4 className="font-semibold">{location.city}</h4>
                            <p className="text-sm text-muted-foreground">{location.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{location.count.toLocaleString()} nodes</p>
                          <p className="text-sm text-green-500">${(location.earnings / 1000).toFixed(1)}K/day</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {location.projects.map((projectId) => {
                          const project = projects.find(p => p.id === projectId);
                          return project ? (
                            <Badge key={projectId} variant="outline" className="text-xs">
                              {project.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <Badge variant={location.status === 'online' ? 'default' : 'secondary'}>
                            {location.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordinates: </span>
                          <span className="font-mono text-xs">
                            {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Americas', 'Europe', 'Asia', 'Oceania'].map((region) => {
                      const regionLocations = filteredLocations.filter(loc => {
                        if (region === 'Americas') return ['United States', 'Canada'].includes(loc.country);
                        if (region === 'Europe') return ['United Kingdom', 'Germany'].includes(loc.country);
                        if (region === 'Asia') return ['Japan', 'Singapore'].includes(loc.country);
                        if (region === 'Oceania') return loc.country === 'Australia';
                        return false;
                      });
                      
                      const regionNodes = regionLocations.reduce((sum, loc) => sum + loc.count, 0);
                      const percentage = totalNodes > 0 ? (regionNodes / totalNodes) * 100 : 0;
                      
                      return (
                        <div key={region}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{region}</span>
                            <span className="text-sm font-bold">{regionNodes.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {percentage.toFixed(1)}% of total nodes
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredLocations
                      .sort((a, b) => b.earnings - a.earnings)
                      .slice(0, 5)
                      .map((location, index) => (
                        <div key={location.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-semibold">{location.city}</p>
                              <p className="text-xs text-muted-foreground">{location.count} nodes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-500">
                              ${(location.earnings / 1000).toFixed(1)}K/day
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Network Growth Trends</CardTitle>
                <CardDescription>Simulated growth data for the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end justify-between gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const growth = Math.random() * 0.3 + 0.85; // 85%-115% range
                    const height = growth * 80 + 10; // 10-90% height
                    return (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-blue-500 to-green-500 rounded-t-sm flex-1 opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                        title={`Day ${i + 1}: ${(growth * 100).toFixed(1)}% of current nodes`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Node count growth over the last 30 days
                </p>
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