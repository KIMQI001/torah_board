"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';
import { MyNode, DEFAULT_DEPIN_PROJECTS } from './depin-store';
import { useLanguage } from '@/hooks/use-language';

interface AddNodeModalProps {
  trigger: React.ReactNode;
  onNodeAdd: (node: Omit<MyNode, 'id'>) => void;
}

export function AddNodeModal({ trigger, onNodeAdd }: AddNodeModalProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    network: '',
    nodeId: '',
    type: '',
    capacity: '',
    location: '',
    hardwareType: 'storage' as const,
    hardwareSpec: '',
    powerConsumption: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成随机收益
      const baseEarning = Math.random() * 100 + 10;
      const newNode: Omit<MyNode, 'id'> = {
        network: formData.network,
        nodeId: formData.nodeId || `node_${Date.now()}`,
        type: formData.type,
        capacity: formData.capacity,
        earnings: `$${baseEarning.toFixed(2)}/day`,
        status: 'online',
        uptime: '99.2%',
        location: formData.location,
        startDate: new Date().toISOString().split('T')[0],
        totalEarned: baseEarning * Math.random() * 365,
        hardware: [{
          type: formData.hardwareType,
          requirement: formData.hardwareSpec,
          cost: 1000,
          powerConsumption: parseFloat(formData.powerConsumption) || 100
        }],
        performance: {
          cpuUsage: Math.random() * 50 + 30,
          memoryUsage: Math.random() * 40 + 40,
          diskUsage: Math.random() * 60 + 20,
          networkLatency: Math.random() * 20 + 10,
          bandwidthUp: Math.random() * 50 + 10,
          bandwidthDown: Math.random() * 100 + 50
        }
      };

      onNodeAdd(newNode);
      setIsOpen(false);
      setFormData({
        network: '',
        nodeId: '',
        type: '',
        capacity: '',
        location: '',
        hardwareType: 'storage',
        hardwareSpec: '',
        powerConsumption: ''
      });
    } catch (error) {
      console.error('Error adding node:', error);
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
            {language === 'zh' ? '添加新节点' : 'Add New Node'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' ? '添加一个新的DePIN节点到您的列表中' : 'Add a new DePIN node to your list'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="network">
                {language === 'zh' ? '选择网络' : 'Select Network'}
              </Label>
              <Select value={formData.network} onValueChange={(value) => setFormData({...formData, network: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'zh' ? '选择网络' : 'Select network'} />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_DEPIN_PROJECTS.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">
                {language === 'zh' ? '节点类型' : 'Node Type'}
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder={language === 'zh' ? '如：Storage Miner' : 'e.g., Storage Miner'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nodeId">
                {language === 'zh' ? '节点ID' : 'Node ID'}
              </Label>
              <Input
                id="nodeId"
                value={formData.nodeId}
                onChange={(e) => setFormData({...formData, nodeId: e.target.value})}
                placeholder={language === 'zh' ? '自动生成或手动输入' : 'Auto-generate or enter manually'}
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
                placeholder="64 TiB"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">
              {language === 'zh' ? '位置' : 'Location'}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder={language === 'zh' ? '如：北京, 中国' : 'e.g., Beijing, China'}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">
              {language === 'zh' ? '硬件配置' : 'Hardware Configuration'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hardwareType">
                  {language === 'zh' ? '硬件类型' : 'Hardware Type'}
                </Label>
                <Select value={formData.hardwareType} onValueChange={(value: any) => setFormData({...formData, hardwareType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="storage">{language === 'zh' ? '存储' : 'Storage'}</SelectItem>
                    <SelectItem value="cpu">{language === 'zh' ? '处理器' : 'CPU'}</SelectItem>
                    <SelectItem value="gpu">{language === 'zh' ? '显卡' : 'GPU'}</SelectItem>
                    <SelectItem value="memory">{language === 'zh' ? '内存' : 'Memory'}</SelectItem>
                    <SelectItem value="network">{language === 'zh' ? '网络' : 'Network'}</SelectItem>
                    <SelectItem value="sensor">{language === 'zh' ? '传感器' : 'Sensor'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="powerConsumption">
                  {language === 'zh' ? '功耗 (瓦特)' : 'Power Consumption (Watts)'}
                </Label>
                <Input
                  id="powerConsumption"
                  type="number"
                  value={formData.powerConsumption}
                  onChange={(e) => setFormData({...formData, powerConsumption: e.target.value})}
                  placeholder="300"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="hardwareSpec">
                {language === 'zh' ? '硬件规格' : 'Hardware Specifications'}
              </Label>
              <Textarea
                id="hardwareSpec"
                value={formData.hardwareSpec}
                onChange={(e) => setFormData({...formData, hardwareSpec: e.target.value})}
                placeholder={language === 'zh' 
                  ? '如：32-128 TiB SSD, 8核心 2.8GHz+ CPU' 
                  : 'e.g., 32-128 TiB SSD, 8-core 2.8GHz+ CPU'}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'zh' ? '添加节点' : 'Add Node'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}