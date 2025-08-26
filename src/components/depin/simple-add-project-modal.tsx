"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';

interface SimpleAddProjectModalProps {
  trigger: React.ReactNode;
  onProjectAdd: (project: any) => void;
}

export function SimpleAddProjectModal({ trigger, onProjectAdd }: SimpleAddProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'storage',
    description: '',
    apy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newProject = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        apy: formData.apy + '%',
        nodes: '0',
        capacity: '0 TiB',
        rewards: '$0/day',
        status: 'active',
        blockchain: 'Solana',
        tokenSymbol: 'SOL',
        tokenPrice: 100,
        marketCap: '$0',
        volume24h: '$0',
        hardwareRequirement: [],
        minInvestment: 1000,
        roiPeriod: 12,
        geographicFocus: ['Global'],
        riskLevel: 'medium'
      };

      onProjectAdd(newProject);
      setIsOpen(false);
      setFormData({
        name: '',
        category: 'storage',
        description: '',
        apy: '',
      });
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加新项目</DialogTitle>
          <DialogDescription>
            添加一个新的DePIN项目到列表中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="输入项目名称"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">项目类别</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">存储</SelectItem>
                  <SelectItem value="computing">计算</SelectItem>
                  <SelectItem value="wireless">无线网络</SelectItem>
                  <SelectItem value="sensors">传感器</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">项目描述</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="简短描述项目功能"
              required
            />
          </div>

          <div>
            <Label htmlFor="apy">预期APY (%)</Label>
            <Input
              id="apy"
              type="number"
              value={formData.apy}
              onChange={(e) => setFormData({...formData, apy: e.target.value})}
              placeholder="15"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              添加项目
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}