"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  MapPin,
  Zap,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { DePINProject, ROICalculation, depinStore } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface ROICalculatorModalProps {
  trigger: React.ReactNode;
}

export function ROICalculatorModal({ trigger }: ROICalculatorModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState('San Francisco');
  const [customHardwareCost, setCustomHardwareCost] = useState<number>(0);
  const [monthlyElectricityCost, setMonthlyElectricityCost] = useState<number>(150);
  const [roiData, setRoiData] = useState<ROICalculation | null>(null);
  const [projects, setProjects] = useState<DePINProject[]>([]);

  const locations = [
    'San Francisco', 'New York', 'Austin', 'Denver', 'Los Angeles', 
    'Chicago', 'Miami', 'Seattle', 'Boston', 'Atlanta'
  ];

  useEffect(() => {
    if (isOpen) {
      setProjects(depinStore.getProjects());
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject && selectedLocation) {
      calculateROI();
    }
  }, [selectedProject, selectedLocation, customHardwareCost, monthlyElectricityCost]);

  const calculateROI = () => {
    if (!selectedProject) return;
    
    try {
      const roi = depinStore.calculateROI(selectedProject, selectedLocation, customHardwareCost || undefined);
      // Adjust for custom electricity cost
      const adjustedRoi = {
        ...roi,
        monthlyCost: monthlyElectricityCost,
        roiMonths: roi.hardwareCost / (roi.estimatedMonthlyReward - monthlyElectricityCost),
        annualROI: ((roi.estimatedMonthlyReward * 12 - monthlyElectricityCost * 12) / roi.hardwareCost) * 100
      };
      setRoiData(adjustedRoi);
    } catch (error) {
      console.error('ROI calculation error:', error);
      setRoiData(null);
    }
  };

  const getSelectedProject = (): DePINProject | undefined => {
    return projects.find(p => p.id === selectedProject);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 20) return 'text-green-500';
    if (roi > 10) return 'text-blue-500';
    if (roi > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const project = getSelectedProject();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Calculator className="h-6 w-6" />
            </div>
            DePIN ROI Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate potential returns for DePIN network participation
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Select DePIN Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            {project.name}
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {project && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hardware-cost">
                        Hardware Cost (Default: ${project.hardwareRequirement.reduce((sum, hw) => sum + hw.cost, 0).toLocaleString()})
                      </Label>
                      <Input
                        id="hardware-cost"
                        type="number"
                        value={customHardwareCost || project.hardwareRequirement.reduce((sum, hw) => sum + hw.cost, 0)}
                        onChange={(e) => setCustomHardwareCost(Number(e.target.value))}
                        placeholder="Enter custom hardware cost"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="electricity-cost">Monthly Electricity + Internet Cost ($)</Label>
                      <Input
                        id="electricity-cost"
                        type="number"
                        value={monthlyElectricityCost}
                        onChange={(e) => setMonthlyElectricityCost(Number(e.target.value))}
                        placeholder="Monthly operating cost"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {project && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge>{project.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blockchain</span>
                    <Badge variant="outline">{project.blockchain}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="font-bold text-green-500">{project.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Investment</span>
                    <span className="font-bold">${project.minInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <Badge variant="outline" className={getRiskColor(project.riskLevel)}>
                      {project.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {roiData && project ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      ROI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold">${roiData.hardwareCost.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Initial Investment</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold">${roiData.monthlyCost}</div>
                        <p className="text-xs text-muted-foreground">Monthly Cost</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          <h4 className="font-semibold">Monthly Revenue</h4>
                        </div>
                        <p className="text-3xl font-bold text-green-500">
                          ${roiData.estimatedMonthlyReward.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Net: ${(roiData.estimatedMonthlyReward - roiData.monthlyCost).toFixed(2)}/month
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5" />
                          <h4 className="font-semibold">Payback Period</h4>
                        </div>
                        <p className="text-3xl font-bold">
                          {roiData.roiMonths > 0 ? `${roiData.roiMonths.toFixed(1)} months` : 'Never'}
                        </p>
                        {roiData.roiMonths > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Break-even: {new Date(Date.now() + roiData.roiMonths * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5" />
                          <h4 className="font-semibold">Annual ROI</h4>
                        </div>
                        <p className={`text-3xl font-bold ${getROIColor(roiData.annualROI)}`}>
                          {roiData.annualROI > 0 ? '+' : ''}{roiData.annualROI.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expected annual return on investment
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">6 Month Earnings</span>
                      <span className="font-bold">
                        ${((roiData.estimatedMonthlyReward - roiData.monthlyCost) * 6).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">1 Year Earnings</span>
                      <span className="font-bold text-green-500">
                        ${((roiData.estimatedMonthlyReward - roiData.monthlyCost) * 12).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2 Year Total</span>
                      <span className="font-bold text-blue-500">
                        ${((roiData.estimatedMonthlyReward - roiData.monthlyCost) * 24).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total Investment</span>
                      <span className="font-bold">
                        ${(roiData.hardwareCost + roiData.monthlyCost * 24).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {roiData.riskFactors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {roiData.riskFactors.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Select a project and location to calculate ROI
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            * Results are estimates based on current market conditions and may vary significantly
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}