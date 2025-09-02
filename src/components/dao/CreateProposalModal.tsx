'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
}

// Map frontend proposal types to backend categories
function mapTypeToCategory(type: string): string {
  const mapping: Record<string, string> = {
    'GENERAL': 'GOVERNANCE',
    'FUNDING': 'TREASURY',
    'GOVERNANCE': 'GOVERNANCE', 
    'TECHNICAL': 'INVESTMENT'
  };
  return mapping[type] || 'GOVERNANCE';
}

export function CreateProposalModal({ isOpen, onClose, onSuccess }: CreateProposalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'GENERAL' as 'GENERAL' | 'FUNDING' | 'GOVERNANCE' | 'TECHNICAL',
    amount: '',
    recipient: '',
    votingDuration: '7'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const cleanedData = {
        title: formData.title,
        description: formData.description,
        category: mapTypeToCategory(formData.type),
        requestedAmount: formData.amount ? parseFloat(formData.amount) : undefined,
        votingPeriodDays: parseInt(formData.votingDuration) || 7,
        recipient: formData.recipient || undefined
      };

      // Remove amount and recipient if not a funding proposal
      if (formData.type !== 'FUNDING') {
        delete cleanedData.requestedAmount;
        delete cleanedData.recipient;
      }

      await onSuccess(cleanedData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'GENERAL',
        amount: '',
        recipient: '',
        votingDuration: '7'
      });
    } catch (error) {
      console.error('Failed to create proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'GENERAL',
        amount: '',
        recipient: '',
        votingDuration: '7'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Proposal</h2>
              <p className="text-sm text-gray-500 mt-1">
                Submit a proposal for DAO members to vote on
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, descriptive title"
                  required
                  disabled={isSubmitting}
                  className={formData.title.length < 5 && formData.title.length > 0 ? 'border-red-300 focus:ring-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs">
                    {formData.title.length < 5 && formData.title.length > 0 && (
                      <span className="text-red-600">
                        标题至少需要5个字符 (当前: {formData.title.length}/5)
                      </span>
                    )}
                    {formData.title.length >= 5 && (
                      <span className="text-green-600">
                        ✓ 标题长度符合要求
                      </span>
                    )}
                    {formData.title.length === 0 && (
                      <span className="text-gray-500">
                        请输入至少5个字符的标题
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formData.title.length}/200
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="type">Proposal Type</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="GENERAL">General</option>
                  <option value="FUNDING">Funding Request</option>
                  <option value="GOVERNANCE">Governance</option>
                  <option value="TECHNICAL">Technical</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === 'FUNDING' && 'Request funds from the DAO treasury'}
                  {formData.type === 'GOVERNANCE' && 'Changes to DAO structure or rules'}
                  {formData.type === 'TECHNICAL' && 'Technical improvements or integrations'}
                  {formData.type === 'GENERAL' && 'General proposals and discussions'}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about your proposal, including rationale, implementation plan, and expected outcomes"
                  rows={5}
                  required
                  disabled={isSubmitting}
                  className={formData.description.length < 20 && formData.description.length > 0 ? 'border-red-300 focus:ring-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs">
                    {formData.description.length < 20 && formData.description.length > 0 && (
                      <span className="text-red-600">
                        描述至少需要20个字符 (当前: {formData.description.length}/20)
                      </span>
                    )}
                    {formData.description.length >= 20 && (
                      <span className="text-green-600">
                        ✓ 描述长度符合要求
                      </span>
                    )}
                    {formData.description.length === 0 && (
                      <span className="text-gray-500">
                        请输入至少20个字符的详细描述
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formData.description.length}/5000
                  </span>
                </div>
              </div>
            </div>

            {/* Funding-specific fields */}
            {formData.type === 'FUNDING' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900">Funding Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Requested Amount (SOL) *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required={formData.type === 'FUNDING'}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      name="recipient"
                      value={formData.recipient}
                      onChange={handleInputChange}
                      placeholder="Solana wallet address"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Voting Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Voting Configuration</h3>
              
              <div>
                <Label htmlFor="votingDuration">Voting Duration (days)</Label>
                <select
                  id="votingDuration"
                  name="votingDuration"
                  value={formData.votingDuration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days (recommended)</option>
                  <option value="10">10 days</option>
                  <option value="14">14 days</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  How long members can vote on this proposal
                </p>
              </div>
            </div>

            {/* Warning for funding proposals */}
            {formData.type === 'FUNDING' && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Funding proposals require a higher quorum and will transfer funds from the DAO treasury if approved. 
                  Make sure to provide detailed justification and budget breakdown.
                </p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title || formData.title.length < 5 || !formData.description || formData.description.length < 20}
              >
                {isSubmitting ? 'Creating...' : 'Create Proposal'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}