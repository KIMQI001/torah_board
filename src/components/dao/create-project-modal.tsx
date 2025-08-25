"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/use-language';
import { daoStore, Project } from './dao-store';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

interface MilestoneForm {
  title: string;
  description: string;
  budget: string;
  targetDate: string;
  deliverables: string[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Product Development',
    totalBudget: '',
    expectedDuration: '180', // days
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    teamMembers: [''] // Start with one empty member field
  });

  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    {
      title: '',
      description: '',
      budget: '',
      targetDate: '',
      deliverables: ['']
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common.required');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common.required');
    }

    if (!formData.totalBudget || isNaN(Number(formData.totalBudget)) || Number(formData.totalBudget) <= 0) {
      newErrors.totalBudget = t('common.invalidAmount');
    }

    if (!formData.expectedDuration || isNaN(Number(formData.expectedDuration)) || Number(formData.expectedDuration) <= 0) {
      newErrors.expectedDuration = t('common.invalidPeriod');
    }

    // Validate milestones
    milestones.forEach((milestone, index) => {
      if (!milestone.title.trim()) {
        newErrors[`milestone_${index}_title`] = t('common.required');
      }
      if (!milestone.budget || isNaN(Number(milestone.budget)) || Number(milestone.budget) <= 0) {
        newErrors[`milestone_${index}_budget`] = t('common.invalidAmount');
      }
      if (!milestone.targetDate) {
        newErrors[`milestone_${index}_date`] = t('common.required');
      }
    });

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
      const durationDays = Number(formData.expectedDuration);
      
      const newProject: Project = {
        id: daoStore.generateId(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: 'planning',
        totalBudget: Number(formData.totalBudget),
        allocatedFunds: 0,
        spentFunds: 0,
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Start in a week
        expectedEndDate: new Date(now.getTime() + (durationDays + 7) * 24 * 60 * 60 * 1000),
        category: formData.category,
        roi: 0, // Will be estimated later
        riskLevel: formData.riskLevel,
        teamMembers: formData.teamMembers.filter(member => member.trim() !== ''),
        created: now,
        createdBy: 'current-user-address',
        milestones: milestones
          .filter(m => m.title.trim() !== '')
          .map((milestone, index) => ({
            id: `${daoStore.generateId()}_ms_${index}`,
            title: milestone.title.trim(),
            description: milestone.description.trim(),
            targetDate: new Date(milestone.targetDate),
            budget: Number(milestone.budget),
            status: 'pending' as const,
            deliverables: milestone.deliverables.filter(d => d.trim() !== ''),
            verificationRequirement: 51
          }))
      };

      daoStore.addProject(newProject);
      onSuccess(newProject);
      handleClose();

    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Product Development',
      totalBudget: '',
      expectedDuration: '180',
      riskLevel: 'medium',
      teamMembers: ['']
    });
    setMilestones([{
      title: '',
      description: '',
      budget: '',
      targetDate: '',
      deliverables: ['']
    }]);
    setErrors({});
    onClose();
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: '',
      description: '',
      budget: '',
      targetDate: '',
      deliverables: ['']
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneForm, value: string) => {
    const updated = [...milestones];
    if (field === 'deliverables') {
      // Handle deliverables array separately
      return;
    }
    (updated[index] as any)[field] = value;
    setMilestones(updated);
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, '']
    }));
  };

  const updateTeamMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => i === index ? value : member)
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t('dao.createProject')}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="project-title">{t('dao.projectTitle')} *</Label>
              <Input
                id="project-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title..."
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="project-description">{t('dao.description')} *</Label>
              <Textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('dao.projectCategory')} *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product Development">Product Development</SelectItem>
                    <SelectItem value="DeFi">DeFi</SelectItem>
                    <SelectItem value="NFT">NFT</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">{t('dao.projectBudget')} (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalBudget: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className={errors.totalBudget ? 'border-red-500' : ''}
                />
                {errors.totalBudget && <p className="text-red-500 text-sm mt-1">{errors.totalBudget}</p>}
              </div>

              <div>
                <Label>{t('dao.projectRisk')} *</Label>
                <Select value={formData.riskLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, riskLevel: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('dao.low')}</SelectItem>
                    <SelectItem value="medium">{t('dao.medium')}</SelectItem>
                    <SelectItem value="high">{t('dao.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Expected Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.expectedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDuration: e.target.value }))}
                min="1"
                max="1000"
                className={errors.expectedDuration ? 'border-red-500' : ''}
              />
              {errors.expectedDuration && <p className="text-red-500 text-sm mt-1">{errors.expectedDuration}</p>}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t('dao.projectTeam')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>
            <div className="space-y-2">
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={member}
                    onChange={(e) => updateTeamMember(index, e.target.value)}
                    placeholder="Enter Solana address or member ID..."
                  />
                  {formData.teamMembers.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeTeamMember(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">{t('dao.milestones')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </div>
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Milestone {index + 1}</h4>
                    {milestones.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeMilestone(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="Milestone title..."
                        className={errors[`milestone_${index}_title`] ? 'border-red-500' : ''}
                      />
                      {errors[`milestone_${index}_title`] && 
                        <p className="text-red-500 text-sm mt-1">{errors[`milestone_${index}_title`]}</p>}
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Milestone description..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Budget (USD) *</Label>
                        <Input
                          type="number"
                          value={milestone.budget}
                          onChange={(e) => updateMilestone(index, 'budget', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="1000"
                          className={errors[`milestone_${index}_budget`] ? 'border-red-500' : ''}
                        />
                        {errors[`milestone_${index}_budget`] && 
                          <p className="text-red-500 text-sm mt-1">{errors[`milestone_${index}_budget`]}</p>}
                      </div>

                      <div>
                        <Label>Target Date *</Label>
                        <Input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className={errors[`milestone_${index}_date`] ? 'border-red-500' : ''}
                        />
                        {errors[`milestone_${index}_date`] && 
                          <p className="text-red-500 text-sm mt-1">{errors[`milestone_${index}_date`]}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('dao.createProject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};