'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  Edit3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { usePriceAlerts, PriceAlert } from '@/hooks/use-spot-data';
import { useLanguage } from '@/hooks/use-language';

interface PriceAlertManagerProps {
  className?: string;
}

interface CreateAlertFormProps {
  onSubmit: (alert: any) => void;
  onCancel: () => void;
}

const CreateAlertForm: React.FC<CreateAlertFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    targetPrice: '',
    condition: 'above' as const,
    exchange: 'binance',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetPrice: parseFloat(formData.targetPrice)
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>创建价格预警</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">交易对</label>
              <input
                type="text"
                placeholder="例如: BTCUSDT"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">目标价格</label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">预警条件</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="above">价格高于</option>
                <option value="below">价格低于</option>
                <option value="crosses_above">突破上涨</option>
                <option value="crosses_below">突破下跌</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">交易所</label>
              <select
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="binance">Binance</option>
                <option value="okx">OKX</option>
                <option value="gate">Gate.io</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">备注信息 (可选)</label>
            <input
              type="text"
              placeholder="预警提醒信息..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>创建预警</span>
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const PriceAlertManager: React.FC<PriceAlertManagerProps> = ({
  className = ''
}) => {
  const { t } = useLanguage();
  const { alerts, loading, error, refetch, createAlert, updateAlert, deleteAlert } = usePriceAlerts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);

  const handleCreateAlert = async (alertData: any) => {
    try {
      await createAlert(alertData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleToggleAlert = async (alert: PriceAlert) => {
    try {
      await updateAlert(alert.id, { isActive: !alert.isActive });
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (confirm('确定要删除这个预警吗？')) {
      try {
        await deleteAlert(alertId);
      } catch (error) {
        console.error('Failed to delete alert:', error);
      }
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'above':
      case 'crosses_above':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'below':
      case 'crosses_below':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Target className="h-3 w-3 text-gray-600" />;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'above': return '价格高于';
      case 'below': return '价格低于';
      case 'crosses_above': return '突破上涨';
      case 'crosses_below': return '突破下跌';
      default: return condition;
    }
  };

  const getAlertStatusColor = (alert: PriceAlert) => {
    if (alert.isTriggered) return 'bg-orange-100 text-orange-800';
    if (!alert.isActive) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getAlertStatusText = (alert: PriceAlert) => {
    if (alert.isTriggered) return '已触发';
    if (!alert.isActive) return '已暂停';
    return '监控中';
  };

  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.isTriggered);
  const triggeredAlerts = alerts.filter(alert => alert.isTriggered);
  const inactiveAlerts = alerts.filter(alert => !alert.isActive);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading price alerts: {error}</p>
            <Button onClick={refetch} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 头部控制栏 */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BellRing className="h-5 w-5" />
                <span>价格预警管理</span>
                {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                共 {alerts.length} 个预警 | 活跃: {activeAlerts.length} | 已触发: {triggeredAlerts.length}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>新建预警</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 创建预警表单 */}
      {showCreateForm && (
        <CreateAlertForm
          onSubmit={handleCreateAlert}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* 预警列表 */}
      <div className="grid gap-4">
        {/* 已触发的预警 */}
        {triggeredAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>已触发预警 ({triggeredAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <div key={alert.id} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-lg">{alert.symbol}</span>
                          <Badge className="bg-orange-100 text-orange-800">
                            {alert.exchange.toUpperCase()}
                          </Badge>
                          <Badge className={getAlertStatusColor(alert)}>
                            {getAlertStatusText(alert)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          {getConditionIcon(alert.condition)}
                          <span>{getConditionText(alert.condition)} ${alert.targetPrice}</span>
                        </div>
                        
                        {alert.message && (
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>触发时间: {new Date(alert.triggeredAt!).toLocaleString()}</span>
                          <span>创建时间: {new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 活跃预警 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>活跃预警 ({activeAlerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无活跃预警</p>
                <p className="text-sm">点击"新建预警"创建您的第一个价格预警</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-lg">{alert.symbol}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {alert.exchange.toUpperCase()}
                          </Badge>
                          <Badge className={getAlertStatusColor(alert)}>
                            {getAlertStatusText(alert)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          {getConditionIcon(alert.condition)}
                          <span>{getConditionText(alert.condition)} ${alert.targetPrice}</span>
                        </div>
                        
                        {alert.message && (
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>创建时间: {new Date(alert.createdAt).toLocaleString()}</span>
                          <span>最后更新: {new Date(alert.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAlert(alert)}
                          className="text-gray-600"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 已暂停的预警 */}
        {inactiveAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>已暂停预警 ({inactiveAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inactiveAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 bg-gray-50 opacity-75">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{alert.symbol}</span>
                          <Badge variant="outline">
                            {alert.exchange.toUpperCase()}
                          </Badge>
                          <Badge className={getAlertStatusColor(alert)}>
                            {getAlertStatusText(alert)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          {getConditionIcon(alert.condition)}
                          <span>{getConditionText(alert.condition)} ${alert.targetPrice}</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          创建时间: {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAlert(alert)}
                          className="text-green-600"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};