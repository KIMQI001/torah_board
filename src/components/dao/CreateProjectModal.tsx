'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    totalBudget: '',
    startDate: '',
    expectedEndDate: '',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    teamMembers: ['']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamMemberChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => i === index ? value : member)
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, '']
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Filter out empty team members
      const cleanedData = {
        ...formData,
        totalBudget: parseFloat(formData.totalBudget) || 0,
        teamMembers: formData.teamMembers.filter(member => member.trim() !== '')
      };

      await onSuccess(cleanedData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        totalBudget: '',
        startDate: '',
        expectedEndDate: '',
        riskLevel: 'MEDIUM',
        teamMembers: ['']
      });
    } catch (error) {
      console.error('Failed to create project:', error);
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
        category: '',
        totalBudget: '',
        startDate: '',
        expectedEndDate: '',
        riskLevel: 'MEDIUM',
        teamMembers: ['']
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
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a new project for your DAO with milestones and budget allocation
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
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Development, Marketing, Research"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the project objectives and deliverables"
                  rows={3}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Budget and Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Budget &amp; Timeline</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalBudget">Total Budget (SOL)</Label>
                  <Input
                    id="totalBudget"
                    name="totalBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalBudget}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expectedEndDate">Expected End Date</Label>
                  <Input
                    id="expectedEndDate"
                    name="expectedEndDate"
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <select
                    id="riskLevel"
                    name="riskLevel"
                    value={formData.riskLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Team Members</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTeamMember}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="Member wallet address or name"
                    value={member}
                    onChange={(e) => handleTeamMemberChange(index, e.target.value)}
                    disabled={isSubmitting}
                  />
                  {formData.teamMembers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeamMember(index)}
                      disabled={isSubmitting}
                      className="px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

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
                disabled={isSubmitting || !formData.title || !formData.description || !formData.startDate || !formData.expectedEndDate}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}