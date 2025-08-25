"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/use-language';
import { daoStore, Proposal } from './dao-store';
import { X } from 'lucide-react';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (proposal: Proposal) => void;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'investment' as 'investment' | 'governance' | 'treasury' | 'membership',
    requestedAmount: '',
    votingPeriod: '7',
    quorum: '50000',
    threshold: '60',
    discussion: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common.required');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common.required');
    }

    if (formData.requestedAmount && (isNaN(Number(formData.requestedAmount)) || Number(formData.requestedAmount) <= 0)) {
      newErrors.requestedAmount = t('common.invalidAmount');
    }

    if (isNaN(Number(formData.votingPeriod)) || Number(formData.votingPeriod) <= 0) {
      newErrors.votingPeriod = t('common.invalidPeriod');
    }

    if (isNaN(Number(formData.quorum)) || Number(formData.quorum) <= 0) {
      newErrors.quorum = t('common.invalidQuorum');
    }

    if (isNaN(Number(formData.threshold)) || Number(formData.threshold) <= 0 || Number(formData.threshold) > 100) {
      newErrors.threshold = t('common.invalidThreshold');
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
      const now = new Date();
      const votingPeriodDays = Number(formData.votingPeriod);
      
      const newProposal: Proposal = {
        id: daoStore.generateId(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        proposer: 'current-user-address', // In real app, get from wallet
        status: 'draft',
        votingPower: { for: 0, against: 0, abstain: 0, total: 0 },
        quorum: Number(formData.quorum),
        threshold: Number(formData.threshold),
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Start tomorrow
        endTime: new Date(now.getTime() + (votingPeriodDays + 1) * 24 * 60 * 60 * 1000),
        requestedAmount: formData.requestedAmount ? Number(formData.requestedAmount) : undefined,
        category: formData.category,
        discussion: formData.discussion.trim() || undefined,
        created: now,
        createdBy: 'current-user-address'
      };

      daoStore.addProposal(newProposal);
      onSuccess(newProposal);
      handleClose();

    } catch (error) {
      console.error('Error creating proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'investment',
      requestedAmount: '',
      votingPeriod: '7',
      quorum: '50000',
      threshold: '60',
      discussion: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t('dao.createNewProposal')}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">{t('dao.proposalTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter proposal title..."
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t('dao.proposalDescription')} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your proposal in detail..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Category */}
            <div>
              <Label>{t('dao.proposalCategory')} *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investment">{t('dao.investment')}</SelectItem>
                  <SelectItem value="governance">{t('dao.governance')}</SelectItem>
                  <SelectItem value="treasury">{t('dao.treasury')}</SelectItem>
                  <SelectItem value="membership">{t('dao.members')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requested Amount */}
            <div>
              <Label htmlFor="amount">{t('dao.proposalAmount')} (Optional)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.requestedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
                placeholder="0"
                min="0"
                step="1000"
                className={errors.requestedAmount ? 'border-red-500' : ''}
              />
              {errors.requestedAmount && <p className="text-red-500 text-sm mt-1">{errors.requestedAmount}</p>}
            </div>

            {/* Voting Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="period">{t('dao.votingPeriod')} (days) *</Label>
                <Input
                  id="period"
                  type="number"
                  value={formData.votingPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, votingPeriod: e.target.value }))}
                  min="1"
                  max="30"
                  className={errors.votingPeriod ? 'border-red-500' : ''}
                />
                {errors.votingPeriod && <p className="text-red-500 text-sm mt-1">{errors.votingPeriod}</p>}
              </div>

              <div>
                <Label htmlFor="quorum">{t('dao.quorumRequired')} *</Label>
                <Input
                  id="quorum"
                  type="number"
                  value={formData.quorum}
                  onChange={(e) => setFormData(prev => ({ ...prev, quorum: e.target.value }))}
                  min="1"
                  className={errors.quorum ? 'border-red-500' : ''}
                />
                {errors.quorum && <p className="text-red-500 text-sm mt-1">{errors.quorum}</p>}
              </div>

              <div>
                <Label htmlFor="threshold">{t('dao.passThreshold')} (%) *</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                  min="50"
                  max="100"
                  className={errors.threshold ? 'border-red-500' : ''}
                />
                {errors.threshold && <p className="text-red-500 text-sm mt-1">{errors.threshold}</p>}
              </div>
            </div>

            {/* Discussion Link */}
            <div>
              <Label htmlFor="discussion">Discussion Link (Optional)</Label>
              <Input
                id="discussion"
                type="url"
                value={formData.discussion}
                onChange={(e) => setFormData(prev => ({ ...prev, discussion: e.target.value }))}
                placeholder="https://forum.example.com/proposal"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('dao.createProposal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};