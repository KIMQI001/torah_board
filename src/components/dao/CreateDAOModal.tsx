'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { X, Loader2 } from 'lucide-react';

interface CreateDAOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dao: any) => void;
}

export function CreateDAOModal({ isOpen, onClose, onSuccess }: CreateDAOModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    treasuryAddress: '',
    governanceToken: '',
    totalSupply: '',
    quorumThreshold: '50',
    votingPeriod: '7'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'DAO name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'DAO name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.treasuryAddress.trim()) {
      newErrors.treasuryAddress = 'Treasury address is required';
    } else if (formData.treasuryAddress.length < 32 || formData.treasuryAddress.length > 44) {
      newErrors.treasuryAddress = 'Invalid treasury address format';
    }

    if (!formData.governanceToken.trim()) {
      newErrors.governanceToken = 'Governance token is required';
    } else if (formData.governanceToken.length < 2 || formData.governanceToken.length > 10) {
      newErrors.governanceToken = 'Token symbol must be 2-10 characters';
    }

    const quorum = parseInt(formData.quorumThreshold);
    if (isNaN(quorum) || quorum < 1 || quorum > 100) {
      newErrors.quorumThreshold = 'Quorum threshold must be between 1-100%';
    }

    const votingPeriod = parseInt(formData.votingPeriod);
    if (isNaN(votingPeriod) || votingPeriod < 1 || votingPeriod > 30) {
      newErrors.votingPeriod = 'Voting period must be between 1-30 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const daoData = {
        ...formData,
        totalSupply: formData.totalSupply ? parseInt(formData.totalSupply) : 1000000,
        quorumThreshold: parseInt(formData.quorumThreshold),
        votingPeriod: parseInt(formData.votingPeriod)
      };

      await onSuccess(daoData);
      handleClose();
    } catch (error) {
      console.error('Failed to create DAO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      treasuryAddress: '',
      governanceToken: '',
      totalSupply: '',
      quorumThreshold: '50',
      votingPeriod: '7'
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create New DAO</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DAO Name */}
            <div>
              <Label htmlFor="name">DAO Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., DeFi Innovation DAO"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Governance Token */}
            <div>
              <Label htmlFor="governanceToken">Governance Token *</Label>
              <Input
                id="governanceToken"
                value={formData.governanceToken}
                onChange={(e) => handleInputChange('governanceToken', e.target.value.toUpperCase())}
                placeholder="e.g., DEFI"
                maxLength={10}
                className={errors.governanceToken ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.governanceToken && <p className="text-red-500 text-sm mt-1">{errors.governanceToken}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and goals of your DAO..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Treasury Address */}
          <div>
            <Label htmlFor="treasuryAddress">Treasury Address *</Label>
            <Input
              id="treasuryAddress"
              value={formData.treasuryAddress}
              onChange={(e) => handleInputChange('treasuryAddress', e.target.value)}
              placeholder="Solana wallet address for treasury"
              className={errors.treasuryAddress ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.treasuryAddress && <p className="text-red-500 text-sm mt-1">{errors.treasuryAddress}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Supply */}
            <div>
              <Label htmlFor="totalSupply">Total Supply</Label>
              <Input
                id="totalSupply"
                type="number"
                value={formData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                placeholder="1000000"
                min="1"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Optional, defaults to 1M</p>
            </div>

            {/* Quorum Threshold */}
            <div>
              <Label htmlFor="quorumThreshold">Quorum Threshold (%)</Label>
              <Input
                id="quorumThreshold"
                type="number"
                value={formData.quorumThreshold}
                onChange={(e) => handleInputChange('quorumThreshold', e.target.value)}
                min="1"
                max="100"
                className={errors.quorumThreshold ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.quorumThreshold && <p className="text-red-500 text-sm mt-1">{errors.quorumThreshold}</p>}
            </div>

            {/* Voting Period */}
            <div>
              <Label htmlFor="votingPeriod">Voting Period (days)</Label>
              <Input
                id="votingPeriod"
                type="number"
                value={formData.votingPeriod}
                onChange={(e) => handleInputChange('votingPeriod', e.target.value)}
                min="1"
                max="30"
                className={errors.votingPeriod ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.votingPeriod && <p className="text-red-500 text-sm mt-1">{errors.votingPeriod}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create DAO'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}