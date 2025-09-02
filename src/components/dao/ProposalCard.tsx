'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Users, DollarSign, ExternalLink, MoreVertical,
  ThumbsUp, ThumbsDown, Minus, Eye, Edit3, Trash2, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  MessageCircle, Share2, Flag
} from 'lucide-react';
import { DAOProposal } from '@/lib/api';

interface ProposalCardProps {
  proposal: DAOProposal;
  onVote: (proposalId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => void;
  onViewDetails: (proposal: DAOProposal) => void;
  onEdit?: (proposal: DAOProposal) => void;
  onDelete?: (proposalId: string) => void;
  onExecute?: (proposalId: string) => void;
  onCancel?: (proposalId: string) => void;
  isLoading?: boolean;
  userRole?: 'CHAIR' | 'ADMIN' | 'MEMBER';
}

export function ProposalCard({
  proposal,
  onVote,
  onViewDetails,
  onEdit,
  onDelete,
  onExecute,
  onCancel,
  isLoading = false,
  userRole = 'MEMBER'
}: ProposalCardProps) {
  const [openDropdown, setOpenDropdown] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'passed':
      case 'executed':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'expired':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Clock className="h-3 w-3" />;
      case 'passed':
      case 'executed':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      case 'expired':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'investment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'governance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'treasury':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'membership':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalVotes = proposal.votesFor + proposal.votesAgainst + (proposal.votesAbstain || 0);
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? ((proposal.votesAbstain || 0) / totalVotes) * 100 : 0;

  const isExpired = new Date(proposal.votingEndDate) < new Date();
  const canVote = proposal.status === 'ACTIVE' && !isExpired;

  // Debug: Log voting conditions
  console.log('ProposalCard - Voting conditions:', {
    proposalId: proposal.id,
    status: proposal.status,
    votingEndDate: proposal.votingEndDate,
    isExpired,
    canVote
  });
  const canExecute = proposal.status === 'PASSED' && ['CHAIR', 'ADMIN'].includes(userRole || '');
  const canCancel = proposal.status === 'ACTIVE' && ['CHAIR', 'ADMIN'].includes(userRole || '');
  const canEdit = proposal.status === 'DRAFT' && ['CHAIR', 'ADMIN'].includes(userRole || '');
  // Allow deletion for DRAFT, CANCELLED proposals, or ACTIVE proposals with no votes (for admins/creators)
  const canDelete = (
    ['DRAFT', 'CANCELLED'].includes(proposal.status) || 
    (proposal.status === 'ACTIVE' && proposal.totalVotes === 0)
  ) && ['CHAIR', 'ADMIN'].includes(userRole || '');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={getCategoryColor(proposal.category)} variant="outline">
              {proposal.category}
            </Badge>
            <Badge className={`${getStatusColor(proposal.status)} border`} variant="outline">
              <span className="flex items-center space-x-1">
                {getStatusIcon(proposal.status)}
                <span>{proposal.status}</span>
              </span>
            </Badge>
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
              onClick={() => onViewDetails(proposal)}>
            {proposal.title}
          </h4>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {proposal.description}
          </p>

          {/* Proposal Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>提议人: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {proposal.status === 'ACTIVE' && !isExpired ? '截止时间: ' : '投票结束: '}
                {formatDate(proposal.votingEndDate)}
                {proposal.status === 'ACTIVE' && !isExpired && (
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    new Date(proposal.votingEndDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {Math.ceil((new Date(proposal.votingEndDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} 天剩余
                  </span>
                )}
              </span>
            </div>
            {proposal.requestedAmount && proposal.requestedAmount > 0 && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>申请资金: ${proposal.requestedAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={() => setOpenDropdown(!openDropdown)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {openDropdown && (
            <div className="absolute right-0 top-8 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onViewDetails(proposal);
                    setOpenDropdown(false);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span>查看详情</span>
                </button>

                {proposal.discussion && (
                  <a
                    href={proposal.discussion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpenDropdown(false)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>参与讨论</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                )}

                <button
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    navigator.share?.({
                      title: proposal.title,
                      text: proposal.description,
                      url: window.location.href
                    });
                    setOpenDropdown(false);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span>分享提案</span>
                </button>

                {/* Admin Actions */}
                {['CHAIR', 'ADMIN'].includes(userRole || '') && (
                  <>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      {canEdit && onEdit && (
                        <button
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            onEdit(proposal);
                            setOpenDropdown(false);
                          }}
                        >
                          <Edit3 className="h-4 w-4 text-blue-600" />
                          <span>编辑提案</span>
                        </button>
                      )}

                      {canExecute && onExecute && (
                        <button
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                          onClick={() => {
                            onExecute(proposal.id);
                            setOpenDropdown(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>执行提案</span>
                        </button>
                      )}

                      {canCancel && onCancel && (
                        <button
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                          onClick={() => {
                            onCancel(proposal.id);
                            setOpenDropdown(false);
                          }}
                        >
                          <Flag className="h-4 w-4" />
                          <span>取消提案</span>
                        </button>
                      )}

                      {canDelete && onDelete && (
                        <button
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            onDelete(proposal.id);
                            setOpenDropdown(false);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>删除提案</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voting Progress */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">投票进度</span>
          <div className="text-right">
            <div className="text-gray-500">{totalVotes.toLocaleString()} 票</div>
            <div className="text-xs text-gray-400">需要31%支持通过</div>
          </div>
        </div>

        {/* For Votes */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">支持</span>
            <span className="font-medium">{proposal.votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 relative">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${forPercentage}%` }}
            />
            {/* 31% 通过线 */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-orange-400"
              style={{ left: '31%' }}
              title="31%通过线"
            />
            {forPercentage >= 31 && (
              <div className="absolute top-0 right-0 -mt-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
              </div>
            )}
          </div>
        </div>

        {/* Against Votes */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-red-600">反对</span>
            <span className="font-medium">{proposal.votesAgainst.toLocaleString()} ({againstPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>

        {/* Abstain Votes */}
        {(proposal.votesAbstain || 0) > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">弃权</span>
              <span className="font-medium">{(proposal.votesAbstain || 0).toLocaleString()} ({abstainPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons or User Vote Status */}
      {proposal.userVote ? (
        // 用户已投票 - 显示投票结果
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">您已投票</span>
            </div>
            <div className="flex items-center space-x-2">
              {proposal.userVote.voteType === 'FOR' && (
                <>
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">支持</span>
                </>
              )}
              {proposal.userVote.voteType === 'AGAINST' && (
                <>
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">反对</span>
                </>
              )}
              {proposal.userVote.voteType === 'ABSTAIN' && (
                <>
                  <Minus className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">弃权</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            投票权重: {proposal.userVote.votingPower} • 
            投票时间: {new Date(proposal.userVote.votedAt).toLocaleDateString('zh-CN')}
          </div>
          {proposal.userVote.reason && (
            <div className="mt-2 text-sm text-gray-600 italic">
              理由: {proposal.userVote.reason}
            </div>
          )}
        </div>
      ) : (canVote || proposal.status === 'ACTIVE' || !['EXECUTED', 'CANCELLED', 'REJECTED'].includes(proposal.status.toUpperCase())) && (
        // 用户未投票 - 显示投票按钮
        <div className="flex space-x-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            onClick={() => onVote(proposal.id, 'FOR')}
            disabled={isLoading || isExpired}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            支持
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
            onClick={() => onVote(proposal.id, 'AGAINST')}
            disabled={isLoading || isExpired}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            反对
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-gray-600 hover:bg-gray-50"
            onClick={() => onVote(proposal.id, 'ABSTAIN')}
            disabled={isLoading || isExpired}
          >
            <Minus className="h-4 w-4 mr-2" />
            弃权
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {isExpired && proposal.status === 'ACTIVE' && (
        <div className="text-center py-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">⏰ 投票时间已过期</p>
        </div>
      )}
      
      {/* Show voting buttons are disabled due to expired status */}
      {isExpired && (canVote || proposal.status === 'ACTIVE' || !['EXECUTED', 'CANCELLED', 'REJECTED'].includes(proposal.status.toUpperCase())) && (
        <div className="text-center py-1">
          <p className="text-xs text-gray-500">投票按钮已禁用 - 投票期已过</p>
        </div>
      )}

      {proposal.status === 'PASSED' && (
        <div className="text-center py-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            ✅ 提案已通过，等待执行
            {forPercentage > 50 && (
              <span className="ml-2 text-xs">({forPercentage.toFixed(1)}% 支持率达到多数)</span>
            )}
          </p>
        </div>
      )}

      {proposal.status === 'FAILED' && (
        <div className="text-center py-2 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            ❌ 提案已被否决
            {againstPercentage > 50 && (
              <span className="ml-2 text-xs">({againstPercentage.toFixed(1)}% 反对率达到多数)</span>
            )}
          </p>
        </div>
      )}

      {proposal.status === 'EXECUTED' && (
        <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">✅ 提案已执行完成</p>
        </div>
      )}
    </div>
  );
}