"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ExternalLink, Plus, Globe, HardDrive, Cpu, Wifi, Activity } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => Promise<{ success: boolean; message: string }>;
}

export function AddProjectModal({ isOpen, onClose, onSubmit }: AddProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'STORAGE' as const,
    description: '',
    blockchain: '',
    tokenSymbol: '',
    websiteUrl: '',
    tokenPrice: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = '项目名称必填';
    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = '项目描述至少10个字符';
    }
    if (!formData.blockchain.trim()) newErrors.blockchain = '区块链必填';
    if (!formData.tokenSymbol.trim()) newErrors.tokenSymbol = '代币符号必填';
    if (!formData.websiteUrl.trim()) newErrors.websiteUrl = '官方网站必填';
    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = '请输入有效的网站链接';
    }
    if (formData.tokenPrice && parseFloat(formData.tokenPrice) < 0) {
      newErrors.tokenPrice = '代币价格不能为负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        blockchain: formData.blockchain.trim(),
        tokenSymbol: formData.tokenSymbol.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        tokenPrice: formData.tokenPrice ? parseFloat(formData.tokenPrice) : 0,
        apy: '15%',
        minInvestment: 1000,
        roiPeriod: 12,
        geographicFocus: ['全球'],
        riskLevel: 'MEDIUM',
        hardwareRequirements: []
      };

      const result = await onSubmit(projectData);
      
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          category: 'STORAGE',
          description: '',
          blockchain: '',
          tokenSymbol: '',
          websiteUrl: '',
          tokenPrice: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            添加新项目
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <ExternalLink className="h-5 w-5 text-gray-500 rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 第一行：项目名称 + 项目类别 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  项目名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例如: Filecoin Storage Network"
                  className={`h-10 ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  项目类别 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STORAGE">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-blue-600" />
                        存储
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPUTING">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-green-600" />
                        计算
                      </div>
                    </SelectItem>
                    <SelectItem value="WIRELESS">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-purple-600" />
                        无线
                      </div>
                    </SelectItem>
                    <SelectItem value="SENSORS">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        传感器
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 第二行：区块链 + 代币符号 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="blockchain" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  区块链 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="blockchain"
                  value={formData.blockchain}
                  onChange={(e) => handleChange('blockchain', e.target.value)}
                  placeholder="例如: Filecoin"
                  className={`h-10 ${
                    errors.blockchain 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.blockchain && <p className="text-sm text-red-500">{errors.blockchain}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenSymbol" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  代币符号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tokenSymbol"
                  value={formData.tokenSymbol}
                  onChange={(e) => handleChange('tokenSymbol', e.target.value)}
                  placeholder="例如: FIL"
                  className={`h-10 uppercase ${
                    errors.tokenSymbol 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.tokenSymbol && <p className="text-sm text-red-500">{errors.tokenSymbol}</p>}
              </div>
            </div>

            {/* 第三行：官方网站 + 代币价格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  官方网站 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                    className={`h-10 pl-10 ${
                      errors.websiteUrl 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.websiteUrl && <p className="text-sm text-red-500">{errors.websiteUrl}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenPrice" className="text-sm font-medium text-gray-700">
                  代币价格 <span className="text-gray-400 text-xs">(可选)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-sm">$</span>
                  <Input
                    id="tokenPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tokenPrice}
                    onChange={(e) => handleChange('tokenPrice', e.target.value)}
                    placeholder="0.00"
                    className={`h-10 pl-8 ${
                      errors.tokenPrice 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.tokenPrice && <p className="text-sm text-red-500">{errors.tokenPrice}</p>}
              </div>
            </div>

            {/* 第四行：项目描述（全宽） */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                项目描述 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="详细描述这个项目的功能、特点和价值主张..."
                rows={4}
                className={`resize-none ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* 按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    创建项目
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}