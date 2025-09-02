'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X, Calendar, Users, DollarSign, ExternalLink, FileText,
  ThumbsUp, ThumbsDown, Minus, Clock, CheckCircle, 
  XCircle, AlertTriangle, MessageCircle, Paperclip
} from 'lucide-react';
import { DAOProposal } from '@/lib/api';

interface ProposalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: DAOProposal | null;
  onVote: (proposalId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => void;
  isLoading?: boolean;
  daoToken?: string;
}

export function ProposalDetailsModal({
  isOpen,
  onClose,
  proposal,
  onVote,
  isLoading = false,
  daoToken = 'TOKEN'
}: ProposalDetailsModalProps) {
  if (!isOpen || !proposal) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
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
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'passed':
      case 'executed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const timeRemaining = () => {
    const now = new Date();
    const end = new Date(proposal.votingEndDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return '已过期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${minutes}分钟`;
    return `${minutes}分钟`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">提案详情</h2>
              <p className="text-sm text-gray-500 mt-1">查看提案详细信息并参与投票</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Proposal Header */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Badge className={getCategoryColor(proposal.category)} variant="outline">
                    {proposal.category}
                  </Badge>
                  <Badge className={`${getStatusColor(proposal.status)} border`} variant="outline">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(proposal.status)}
                      <span>{proposal.status}</span>
                    </span>
                  </Badge>
                  {proposal.status === 'ACTIVE' && (
                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      剩余 {timeRemaining()}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">{proposal.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>提议人: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>创建时间: {formatDate(proposal.createdAt || proposal.votingEndDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>截止时间: {formatDate(proposal.votingEndDate)}</span>
                  </div>
                  {proposal.requestedAmount && proposal.requestedAmount > 0 && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>申请资金: ${proposal.requestedAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposal Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  提案描述
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {proposal.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Discussion Link */}
              {proposal.discussion && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">社区讨论</span>
                    </div>
                    <a
                      href={proposal.discussion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <span>参与讨论</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    参与社区讨论，发表您的意见和建议
                  </p>
                </div>
              )}

              {/* Attachments */}
              {proposal.attachments && proposal.attachments.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Paperclip className="h-4 w-4 mr-2" />
                    附件文档
                  </h3>
                  <div className="space-y-2">
                    {proposal.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-blue-600 hover:text-blue-800">
                          附件 {index + 1}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Voting Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">投票结果</h3>
                  <span className="text-sm text-gray-500">
                    总票数: {totalVotes.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* For Votes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">支持</span>
                      </div>
                      <span className="text-sm font-medium">
                        {proposal.votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={forPercentage} className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${forPercentage}%` }}
                      />
                    </Progress>
                  </div>

                  {/* Against Votes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-600">反对</span>
                      </div>
                      <span className="text-sm font-medium">
                        {proposal.votesAgainst.toLocaleString()} ({againstPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={againstPercentage} className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${againstPercentage}%` }}
                      />
                    </Progress>
                  </div>

                  {/* Abstain Votes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <Minus className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-600">弃权</span>
                      </div>
                      <span className="text-sm font-medium">
                        {(proposal.votesAbstain || 0).toLocaleString()} ({abstainPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={abstainPercentage} className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all duration-300"
                        style={{ width: `${abstainPercentage}%` }}
                      />
                    </Progress>
                  </div>
                </div>

                {/* Quorum Information */}
                {proposal.threshold && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">通过阈值要求</span>
                      <span className="text-sm font-medium text-blue-900">
                        {proposal.threshold}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={forPercentage >= proposal.threshold ? 100 : (forPercentage / proposal.threshold) * 100} className="h-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            forPercentage >= proposal.threshold ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((forPercentage / proposal.threshold) * 100, 100)}%` }}
                        />
                      </Progress>
                      <p className="text-xs text-blue-600 mt-1">
                        {forPercentage >= proposal.threshold 
                          ? '✅ 已达到通过阈值' 
                          : `还需要 ${Math.max(0, proposal.threshold - forPercentage).toFixed(1)}% 的支持票`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Voting Actions */}
          <div className="border-t border-gray-200 p-6">
            {canVote ? (
              <div className="flex space-x-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() => onVote(proposal.id, 'FOR')}
                  disabled={isLoading}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  支持提案
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                  onClick={() => onVote(proposal.id, 'AGAINST')}
                  disabled={isLoading}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  反对提案
                </Button>
                <Button
                  variant="outline"
                  className="text-gray-600 hover:bg-gray-50"
                  onClick={() => onVote(proposal.id, 'ABSTAIN')}
                  disabled={isLoading}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  弃权
                </Button>
              </div>
            ) : (
              <div className="text-center">
                {isExpired ? (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-700">投票期已结束</p>
                  </div>
                ) : proposal.status === 'PASSED' ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700">提案已通过，等待执行</p>
                  </div>
                ) : proposal.status === 'EXECUTED' ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700">提案已执行完成</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700">当前无法投票</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}