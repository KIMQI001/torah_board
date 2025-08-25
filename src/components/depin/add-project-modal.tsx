"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';
import { DePINProject } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface AddProjectModalProps {
  trigger: React.ReactNode;
  onProjectAdd: (project: Omit<DePINProject, 'id'>) => void;
}

export function AddProjectModal({ trigger, onProjectAdd }: AddProjectModalProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'storage' as const,
    description: '',
    nodes: '',
    capacity: '',
    rewards: '',
    apy: '',
    blockchain: '',
    tokenSymbol: '',
    tokenPrice: '',
    marketCap: '',
    volume24h: '',
    minInvestment: '',
    roiPeriod: '',
    geographicFocus: '',
    riskLevel: 'medium' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newProject: Omit<DePINProject, 'id'> = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        nodes: formData.nodes,
        capacity: formData.capacity,
        rewards: formData.rewards,
        apy: formData.apy,
        status: 'active',
        blockchain: formData.blockchain,
        tokenSymbol: formData.tokenSymbol,
        tokenPrice: parseFloat(formData.tokenPrice) || 0,
        marketCap: formData.marketCap,
        volume24h: formData.volume24h,
        hardwareRequirement: [],
        minInvestment: parseFloat(formData.minInvestment) || 0,
        roiPeriod: parseFloat(formData.roiPeriod) || 12,
        geographicFocus: formData.geographicFocus.split(',').map(s => s.trim()),
        riskLevel: formData.riskLevel
      };

      onProjectAdd(newProject);
      setIsOpen(false);
      setFormData({
        name: '',
        category: 'storage',
        description: '',
        nodes: '',
        capacity: '',
        rewards: '',
        apy: '',
        blockchain: '',
        tokenSymbol: '',
        tokenPrice: '',
        marketCap: '',
        volume24h: '',
        minInvestment: '',
        roiPeriod: '',
        geographicFocus: '',
        riskLevel: 'medium'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'zh' ? '添加新项目' : 'Add New Project'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' ? '添加一个新的DePIN项目到列表中' : 'Add a new DePIN project to the list'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                {language === 'zh' ? '项目名称' : 'Project Name'}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={language === 'zh' ? '输入项目名称' : 'Enter project name'}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">
                {language === 'zh' ? '分类' : 'Category'}
              </Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">{language === 'zh' ? '存储' : 'Storage'}</SelectItem>
                  <SelectItem value="computing">{language === 'zh' ? '计算' : 'Computing'}</SelectItem>
                  <SelectItem value="wireless">{language === 'zh' ? '无线' : 'Wireless'}</SelectItem>
                  <SelectItem value="sensors">{language === 'zh' ? '传感器' : 'Sensors'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">
              {language === 'zh' ? '项目描述' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={language === 'zh' ? '输入项目描述' : 'Enter project description'}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nodes">
                {language === 'zh' ? '节点数量' : 'Node Count'}
              </Label>
              <Input
                id="nodes"
                value={formData.nodes}
                onChange={(e) => setFormData({...formData, nodes: e.target.value})}
                placeholder="15,432"
                required
              />
            </div>

            <div>
              <Label htmlFor="capacity">
                {language === 'zh' ? '容量' : 'Capacity'}
              </Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder="18.5 EiB"
                required
              />
            </div>

            <div>
              <Label htmlFor="apy">APY</Label>
              <Input
                id="apy"
                value={formData.apy}
                onChange={(e) => setFormData({...formData, apy: e.target.value})}
                placeholder="12.5%"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blockchain">
                {language === 'zh' ? '区块链' : 'Blockchain'}
              </Label>
              <Input
                id="blockchain"
                value={formData.blockchain}
                onChange={(e) => setFormData({...formData, blockchain: e.target.value})}
                placeholder="Solana"
                required
              />
            </div>

            <div>
              <Label htmlFor="tokenSymbol">
                {language === 'zh' ? '代币符号' : 'Token Symbol'}
              </Label>
              <Input
                id="tokenSymbol"
                value={formData.tokenSymbol}
                onChange={(e) => setFormData({...formData, tokenSymbol: e.target.value})}
                placeholder="SOL"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rewards">
                {language === 'zh' ? '每日奖励' : 'Daily Rewards'}
              </Label>
              <Input
                id="rewards"
                value={formData.rewards}
                onChange={(e) => setFormData({...formData, rewards: e.target.value})}
                placeholder="$1.2M/day"
                required
              />
            </div>

            <div>
              <Label htmlFor="riskLevel">
                {language === 'zh' ? '风险等级' : 'Risk Level'}
              </Label>
              <Select value={formData.riskLevel} onValueChange={(value: any) => setFormData({...formData, riskLevel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{language === 'zh' ? '低风险' : 'Low Risk'}</SelectItem>
                  <SelectItem value="medium">{language === 'zh' ? '中风险' : 'Medium Risk'}</SelectItem>
                  <SelectItem value="high">{language === 'zh' ? '高风险' : 'High Risk'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'zh' ? '添加项目' : 'Add Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}