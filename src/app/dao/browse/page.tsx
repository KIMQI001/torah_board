'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, Users, Vote, Vault, TrendingUp, 
  Calendar, Globe, ExternalLink, ChevronLeft,
  Loader2, AlertCircle, Trash2, Plus
} from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { daoApi, DAO } from '@/lib/api';
import { CreateDAOModal } from '@/components/dao/CreateDAOModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast-container';
import { useToast } from '@/hooks/use-toast';

export default function BrowseDAOsPage() {
  const { isAuthenticated, user } = useAuth();
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [userDAOs, setUserDAOs] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [showCreateDAO, setShowCreateDAO] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const { toasts, success, error: showError, removeToast } = useToast();

  // Load all public DAOs
  useEffect(() => {
    loadDAOs();
  }, [isAuthenticated, user?.id]);

  const loadDAOs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all DAOs from the backend API (without userId to get all public DAOs)
      const allDAOsResponse = await daoApi.getDAOs();
      
      if (allDAOsResponse.success && allDAOsResponse.data) {
        setDAOs(allDAOsResponse.data);
      } else {
        throw new Error(allDAOsResponse.error || 'Failed to fetch DAOs');
      }
      
      // Also fetch user's DAOs if authenticated to check membership and roles
      if (isAuthenticated && user?.id) {
        try {
          const userDAOsResponse = await daoApi.getDAOs(user.id);
          if (userDAOsResponse.success && userDAOsResponse.data) {
            setUserDAOs(userDAOsResponse.data);
            
            // Get user roles for each DAO they're a member of
            const roles: Record<string, string> = {};
            for (const dao of userDAOsResponse.data) {
              // Get detailed DAO info to find member role
              const detailResponse = await daoApi.getDAO(dao.id);
              if (detailResponse.success && detailResponse.data?.members) {
                const member = detailResponse.data.members.find((m: any) => m.userId === user.id);
                if (member) {
                  roles[dao.id] = member.role;
                }
              }
            }
            setUserRoles(roles);
          }
        } catch (err) {
          console.warn('Failed to load user DAOs:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load DAOs:', err);
      setError('Failed to load DAOs');
    } finally {
      setLoading(false);
    }
  };

  const isUserMemberOfDAO = (daoId: string): boolean => {
    return userDAOs.some(dao => dao.id === daoId);
  };

  const handleCreateDAO = async (data: any) => {
    try {
      const response = await daoApi.createDAO(data);
      
      if (response.success) {
        success('DAO created successfully!', 'Your new DAO has been created and you are now an admin.');
        setShowCreateDAO(false);
        await loadDAOs(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to create DAO');
      }
    } catch (err) {
      console.error('Failed to create DAO:', err);
      showError('Failed to create DAO', 'Please check your input and try again.');
    }
  };

  const handleDeleteDAO = (daoId: string, daoName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete DAO',
      description: `Are you sure you want to delete "${daoName}"? This action cannot be undone and will permanently remove all associated data.`,
      onConfirm: () => confirmDeleteDAO(daoId, daoName)
    });
  };

  const confirmDeleteDAO = async (daoId: string, daoName: string) => {
    try {
      setDeleteLoading(daoId);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      
      const response = await daoApi.deleteDAO(daoId);
      
      if (response.success) {
        success('DAO deleted successfully', `"${daoName}" has been permanently removed.`);
        await loadDAOs();
      } else {
        throw new Error(response.error || 'Failed to delete DAO');
      }
    } catch (err) {
      console.error('Failed to delete DAO:', err);
      showError('Failed to delete DAO', 'Please try again later.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleJoinDAO = async (daoId: string) => {
    if (!isAuthenticated) {
      showError('Wallet connection required', 'Please connect your wallet to join a DAO.');
      return;
    }

    try {
      setJoinLoading(daoId);
      
      // Call the real API to join the DAO
      const response = await daoApi.joinDAO(daoId);
      
      if (response.success) {
        success('Successfully joined DAO!', 'You are now a member and can participate in governance.');
        // Refresh the DAOs list to reflect membership changes
        await loadDAOs();
      } else {
        throw new Error(response.error || 'Failed to join DAO');
      }
      
    } catch (err) {
      console.error('Failed to join DAO:', err);
      showError('Failed to join DAO', 'Please try again later.');
    } finally {
      setJoinLoading(null);
    }
  };

  const filteredDAOs = daos.filter(dao => {
    const matchesSearch = !searchQuery || 
      dao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || dao.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-600';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'dissolved':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse DAOs</h1>
          <p className="text-muted-foreground">
            Discover and join decentralized autonomous organizations
          </p>
        </div>
        <Button onClick={() => setShowCreateDAO(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create DAO
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search DAOs by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading DAOs...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* DAOs Grid */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDAOs.map((dao) => (
            <Card key={dao.id} className="hover:shadow-lg transition-shadow relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{dao.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`text-xs ${getStatusColor(dao.status)}`}>
                        {dao.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {dao.governanceToken}
                      </span>
                    </div>
                  </div>
                  {/* Delete button in top-right corner for admins */}
                  {isAuthenticated && userRoles[dao.id] === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteDAO(dao.id, dao.name)}
                      disabled={deleteLoading === dao.id}
                    >
                      {deleteLoading === dao.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {dao.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{dao._count.members}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{dao._count.proposals}</p>
                      <p className="text-xs text-muted-foreground">Proposals</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{dao._count.projects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>

                  {/* Governance Info */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Quorum:</span>
                      <span>{dao.quorumThreshold}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Voting Period:</span>
                      <span>{dao.votingPeriod} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(dao.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="space-y-2">
                    {isAuthenticated && isUserMemberOfDAO(dao.id) ? (
                      <div className="flex space-x-2">
                        <Badge variant="secondary" className="flex-1 justify-center">
                          {userRoles[dao.id] === 'ADMIN' ? 'Admin' : 'Member'}
                        </Badge>
                        <Link href={`/dao?id=${dao.id}`}>
                          <Button variant="outline" size="sm">
                            View DAO
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleJoinDAO(dao.id)}
                        disabled={!isAuthenticated || joinLoading === dao.id}
                      >
                        {joinLoading === dao.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : isAuthenticated ? (
                          'Join DAO'
                        ) : (
                          'Connect Wallet to Join'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDAOs.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No DAOs Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search criteria' 
              : 'Be the first to create a DAO in this community'
            }
          </p>
          {(!searchQuery && statusFilter === 'all') && (
            <Button onClick={() => setShowCreateDAO(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your DAO
            </Button>
          )}
        </div>
      )}

      {/* Create DAO Modal */}
      <CreateDAOModal
        isOpen={showCreateDAO}
        onClose={() => setShowCreateDAO(false)}
        onSuccess={handleCreateDAO}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        type="danger"
        isLoading={deleteLoading !== null}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}