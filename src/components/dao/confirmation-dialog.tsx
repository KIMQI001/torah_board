"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { AlertTriangle, Trash2, Vote, X } from 'lucide-react';

export type ConfirmationType = 'delete' | 'vote' | 'execute' | 'cancel';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: ConfirmationType;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  confirmLabel,
  isLoading = false
}) => {
  const { t } = useLanguage();

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'vote':
        return <Vote className="h-6 w-6 text-blue-600" />;
      case 'execute':
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case 'cancel':
        return <X className="h-6 w-6 text-gray-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'delete':
        return t('common.confirmDelete');
      case 'vote':
        return t('dao.confirmVote');
      case 'execute':
        return t('dao.confirmExecution');
      case 'cancel':
        return t('common.confirmCancel');
      default:
        return t('common.confirm');
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'delete':
        return t('common.deleteWarning');
      case 'vote':
        return t('dao.voteWarning');
      case 'execute':
        return t('dao.executeWarning');
      case 'cancel':
        return t('common.cancelWarning');
      default:
        return t('common.actionWarning');
    }
  };

  const getDefaultConfirmLabel = () => {
    switch (type) {
      case 'delete':
        return t('common.delete');
      case 'vote':
        return t('dao.confirmVote');
      case 'execute':
        return t('dao.execute');
      case 'cancel':
        return t('common.cancel');
      default:
        return t('common.confirm');
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'vote':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'execute':
        return 'bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'delete':
        return 'destructive';
      case 'vote':
        return 'default';
      case 'execute':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getBgColor()}`}>
              {getIcon()}
            </div>
            <span>{title || getDefaultTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-muted-foreground">
            {message || getDefaultMessage()}
          </p>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="button" 
            variant={getButtonVariant() as any}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : (confirmLabel || getDefaultConfirmLabel())}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};