"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Loader2 } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function CustomModal({ isOpen, onClose, title, children }: CustomModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface AddProjectFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddProjectForm({ onSubmit, onCancel, isLoading = false }: AddProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'storage',
    description: '',
    apy: '',
    blockchain: 'Solana',
    tokenSymbol: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.apy) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            项目名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="如：Solana Storage Network"
            className="mt-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            项目类别
          </Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <SelectItem value="storage">🗄️ 存储网络</SelectItem>
              <SelectItem value="computing">💻 计算网络</SelectItem>
              <SelectItem value="wireless">📡 无线网络</SelectItem>
              <SelectItem value="sensors">🌡️ 传感器网络</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          项目描述 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="简短描述项目的核心功能和特点"
          className="mt-1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="apy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            预期APY (%) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="apy"
            type="number"
            value={formData.apy}
            onChange={(e) => setFormData({...formData, apy: e.target.value})}
            placeholder="15"
            className="mt-1"
            min="0"
            max="1000"
            required
          />
        </div>

        <div>
          <Label htmlFor="tokenSymbol" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            代币符号
          </Label>
          <Input
            id="tokenSymbol"
            value={formData.tokenSymbol}
            onChange={(e) => setFormData({...formData, tokenSymbol: e.target.value})}
            placeholder="如：SOL, FIL"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="mr-2 h-4 w-4" />
          创建项目
        </Button>
      </div>
    </form>
  );
}

interface AddNodeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  projects?: Array<{id: string; name: string}>;
}

export function AddNodeForm({ onSubmit, onCancel, isLoading = false, projects = [] }: AddNodeFormProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    network: '',
    nodeIds: '',  // 支持多个节点ID，用空格或逗号分隔
    type: '',
    capacity: '',
    location: '',
    hardwareType: 'storage',
    monitorUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projectId && formData.nodeIds && formData.type) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="network" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            选择网络 <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.projectId} onValueChange={(value) => {
            const project = projects.find(p => p.id === value);
            setFormData({...formData, projectId: value, network: project?.name || ''});
          }}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="选择要加入的网络" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            节点类型 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            placeholder="如：Storage Miner, Validator"
            className="mt-1"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="nodeIds" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          节点ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nodeIds"
          value={formData.nodeIds}
          onChange={(e) => setFormData({...formData, nodeIds: e.target.value})}
          placeholder="输入一个或多个节点ID，用空格或逗号分隔"
          className="mt-1"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          例如：node123 node456 或 node123,node456
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            节点容量 (可选)
          </Label>
          <Input
            id="capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            placeholder="留空将通过API自动获取"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            节点位置
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="如：北京, 中国"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="hardwareType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          硬件类型
        </Label>
        <Select value={formData.hardwareType} onValueChange={(value) => setFormData({...formData, hardwareType: value})}>
          <SelectTrigger className="mt-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <SelectItem value="storage">🗄️ 存储设备</SelectItem>
            <SelectItem value="cpu">💻 处理器</SelectItem>
            <SelectItem value="gpu">🎮 显卡</SelectItem>
            <SelectItem value="network">🌐 网络设备</SelectItem>
            <SelectItem value="sensor">🌡️ 传感器</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="monitorUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          监控链接 (可选)
        </Label>
        <Input
          id="monitorUrl"
          type="url"
          value={formData.monitorUrl}
          onChange={(e) => setFormData({...formData, monitorUrl: e.target.value})}
          placeholder="https://monitor.example.com/node/xxx"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          填写节点的监控面板链接，方便快速访问
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="mr-2 h-4 w-4" />
          创建节点
        </Button>
      </div>
    </form>
  );
}