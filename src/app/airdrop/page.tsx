"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Calendar, CheckCircle, Clock, ExternalLink, Plus, Folder, X, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AirdropPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [activeAirdrops, setActiveAirdrops] = useState([
    {
      project: "Jupiter DEX",
      chain: "Solana",
      deadline: "2024-02-15",
      requirements: ["Trade $100+", "Hold JUP tokens"],
      status: "active",
      estimatedValue: "$50-200",
    },
    {
      project: "Drift Protocol",
      chain: "Solana",
      deadline: "2024-01-30",
      requirements: ["Provide liquidity", "Complete 5 trades"],
      status: "active",
      estimatedValue: "$25-100",
    },
    {
      project: "Tensor NFT",
      chain: "Solana",
      deadline: "2024-03-01",
      requirements: ["List NFT", "Make offer"],
      status: "active",
      estimatedValue: "$10-50",
    },
  ]);

  const [completedAirdrops, setCompletedAirdrops] = useState([
    {
      project: "Pyth Network",
      chain: "Solana",
      claimedDate: "2023-11-20",
      amount: "50号 / 5IP",
      value: "号:50 IP:5",
    },
    {
      project: "Jito MEV",
      chain: "Solana", 
      claimedDate: "2023-12-01",
      amount: "30号 / 3IP",
      value: "号:30 IP:3",
    },
  ]);

  // 添加项目状态
  const [newProject, setNewProject] = useState({
    project: "",
    chain: "",
    deadline: "",
    requirements: "",
    estimatedValue: "",
    type: "active" // active 或 completed
  });
  const [isActiveDialogOpen, setIsActiveDialogOpen] = useState(false);
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "active" | "completed";
    index: number;
    projectName: string;
  }>({
    isOpen: false,
    type: "active",
    index: -1,
    projectName: ""
  });

  // 添加项目
  const handleAddProject = () => {
    if (!newProject.project || !newProject.chain) return;

    const project = {
      project: newProject.project,
      chain: newProject.chain,
      deadline: newProject.deadline,
      requirements: newProject.requirements ? newProject.requirements.split(',').map(req => req.trim()) : [],
      status: "active",
      estimatedValue: newProject.estimatedValue || "$0",
    };

    if (newProject.type === "active") {
      setActiveAirdrops([...activeAirdrops, project]);
    } else {
      const completedProject = {
        project: newProject.project,
        chain: newProject.chain,
        claimedDate: new Date().toISOString().split('T')[0],
        amount: "0",
        value: newProject.estimatedValue || "$0",
      };
      setCompletedAirdrops([...completedAirdrops, completedProject]);
    }

    // 重置表单
    setNewProject({
      project: "",
      chain: "",
      deadline: "",
      requirements: "",
      estimatedValue: "",
      type: "active"
    });
    setIsActiveDialogOpen(false);
    setIsCompletedDialogOpen(false);
  };

  // 删除项目
  const handleDeleteActiveProject = (index: number) => {
    setActiveAirdrops(activeAirdrops.filter((_, i) => i !== index));
    setDeleteConfirm({ isOpen: false, type: "active", index: -1, projectName: "" });
  };

  const handleDeleteCompletedProject = (index: number) => {
    setCompletedAirdrops(completedAirdrops.filter((_, i) => i !== index));
    setDeleteConfirm({ isOpen: false, type: "completed", index: -1, projectName: "" });
  };

  const openDeleteConfirm = (type: "active" | "completed", index: number, projectName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type,
      index,
      projectName
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === "active") {
      handleDeleteActiveProject(deleteConfirm.index);
    } else {
      handleDeleteCompletedProject(deleteConfirm.index);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('airdrop.title')}</h1>
          <p className="text-muted-foreground">
            {t('airdrop.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            {t('tools.calendar')}
          </Button>
          <Button>
            <Gift className="h-4 w-4 mr-2" />
            {t('airdrop.checkEligibility')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('airdrop.activeAirdrops')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAirdrops.length}</div>
            <p className="text-xs text-muted-foreground">2 expiring soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的项目</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAirdrops.length}</div>
            <p className="text-xs text-muted-foreground">总项目数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('airdrop.totalValue')}</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$315</div>
            <p className="text-xs text-muted-foreground">Claimed this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Value</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$85-350</div>
            <p className="text-xs text-muted-foreground">From active drops</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('airdrop.activeAirdrops')}</CardTitle>
                <CardDescription>
                  Complete requirements before deadline
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsActiveDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                添加项目
              </Button>
              <Dialog open={isActiveDialogOpen} onOpenChange={setIsActiveDialogOpen}>
                <DialogContent className="max-w-[540px] mx-auto max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-4 pb-4">
                    <DialogTitle className="text-2xl font-semibold text-center">添加新项目</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-base">
                      添加一个空投项目到您的追踪列表
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4 px-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="project" className="text-base font-medium">项目名称 *</Label>
                        <Input
                          id="project"
                          value={newProject.project}
                          onChange={(e) => setNewProject({...newProject, project: e.target.value})}
                          placeholder="如: Jupiter DEX"
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chain" className="text-base font-medium">区块链 *</Label>
                        <Select onValueChange={(value) => setNewProject({...newProject, chain: value})}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="选择区块链" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Solana">Solana</SelectItem>
                            <SelectItem value="Ethereum">Ethereum</SelectItem>
                            <SelectItem value="BSC">BSC</SelectItem>
                            <SelectItem value="Polygon">Polygon</SelectItem>
                            <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-base font-medium">截止日期</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newProject.deadline}
                          onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedValue" className="text-base font-medium">预估价值</Label>
                        <Input
                          id="estimatedValue"
                          value={newProject.estimatedValue}
                          onChange={(e) => setNewProject({...newProject, estimatedValue: e.target.value})}
                          placeholder="如: $50-200"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="requirements" className="text-base font-medium">任务要求</Label>
                      <Input
                        id="requirements"
                        value={newProject.requirements}
                        onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}
                        placeholder="用逗号分隔，如: 交易 $100+, 持有代币"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      onClick={() => {
                        setNewProject({...newProject, type: "active"});
                        handleAddProject();
                      }}
                      className="px-8 py-3 text-base bg-blue-600 hover:bg-blue-700"
                      disabled={!newProject.project || !newProject.chain}
                    >
                      添加项目
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsActiveDialogOpen(false)}
                      className="px-8 py-3 text-base"
                    >
                      取消
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAirdrops.map((airdrop, index) => (
                <div key={`active-${index}`} className="border rounded-lg p-4 relative group">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-100 hover:text-red-600"
                    onClick={() => openDeleteConfirm("active", index, airdrop.project)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div className="flex justify-between items-start mb-3 pr-8">
                    <div>
                      <h3 className="font-semibold">{airdrop.project}</h3>
                      <p className="text-sm text-muted-foreground">{airdrop.chain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{airdrop.estimatedValue}</p>
                      <p className="text-xs text-muted-foreground">Estimated</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground">Requirements:</p>
                    {airdrop.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {req}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Deadline: {mounted ? new Date(airdrop.deadline).toLocaleDateString() : airdrop.deadline}
                    </p>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>我的项目</CardTitle>
                <CardDescription>
                  我参与和关注的项目
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsCompletedDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                添加项目
              </Button>
              <Dialog open={isCompletedDialogOpen} onOpenChange={setIsCompletedDialogOpen}>
                <DialogContent className="max-w-[540px] mx-auto max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-4 pb-4">
                    <DialogTitle className="text-2xl font-semibold text-center">添加到我的项目</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-base">
                      从活跃空投中选择一个项目添加到我的项目列表
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4 px-2">
                    <div className="space-y-2">
                      <Label htmlFor="select-project" className="text-base font-medium">选择项目 *</Label>
                      <Select onValueChange={(value) => {
                        const selectedAirdrop = activeAirdrops.find(a => a.project === value);
                        if (selectedAirdrop) {
                          setNewProject({
                            project: selectedAirdrop.project,
                            chain: selectedAirdrop.chain,
                            deadline: selectedAirdrop.deadline,
                            requirements: "",
                            estimatedValue: "",
                            type: "completed"
                          });
                        }
                      }}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="选择活跃空投项目" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAirdrops.map((airdrop) => (
                            <SelectItem key={airdrop.project} value={airdrop.project}>
                              {airdrop.project} ({airdrop.chain})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newProject.project && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-muted-foreground">区块链</Label>
                          <div className="flex items-center h-12 px-4 py-3 text-base bg-muted rounded-md border">
                            <span className="font-medium">{newProject.chain}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="account-count" className="text-base font-medium">起号数量</Label>
                            <Input
                              id="account-count"
                              value={newProject.estimatedValue}
                              onChange={(e) => setNewProject({...newProject, estimatedValue: e.target.value})}
                              placeholder="如: 50"
                              type="number"
                              className="h-12 text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ip-count" className="text-base font-medium">IP 数量</Label>
                            <Input
                              id="ip-count"
                              value={newProject.requirements}
                              onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}
                              placeholder="如: 10"
                              type="number"
                              className="h-12 text-base"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      onClick={() => {
                        if (newProject.project) {
                          const ipCount = newProject.requirements || "0";
                          const accountCount = newProject.estimatedValue || "0";
                          const completedProject = {
                            project: newProject.project,
                            chain: newProject.chain,
                            claimedDate: new Date().toISOString().split('T')[0],
                            amount: `${accountCount}号 / ${ipCount}IP`,
                            value: `号:${accountCount} IP:${ipCount}`,
                          };
                          setCompletedAirdrops([...completedAirdrops, completedProject]);
                          setNewProject({
                            project: "",
                            chain: "",
                            deadline: "",
                            requirements: "",
                            estimatedValue: "",
                            type: "completed"
                          });
                          setIsCompletedDialogOpen(false);
                        }
                      }}
                      disabled={!newProject.project}
                      className="px-8 py-3 text-base bg-green-600 hover:bg-green-700"
                    >
                      添加到我的项目
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCompletedDialogOpen(false)}
                      className="px-8 py-3 text-base"
                    >
                      取消
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedAirdrops.map((airdrop, index) => (
                <div key={`completed-${index}`} className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 relative group">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-100 hover:text-red-600"
                    onClick={() => openDeleteConfirm("completed", index, airdrop.project)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div className="flex justify-between items-start mb-2 pr-8">
                    <div>
                      <h3 className="font-semibold">{airdrop.project}</h3>
                      <p className="text-sm text-muted-foreground">{airdrop.chain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{airdrop.value}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      <span className="font-medium">{airdrop.amount}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mounted ? new Date(airdrop.claimedDate).toLocaleDateString() : airdrop.claimedDate}
                    </p>
                  </div>
                </div>
              ))}
              
              {completedAirdrops.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Folder className="h-12 w-12 mx-auto mb-4" />
                  <p>暂无项目</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: "active", index: -1, projectName: "" })}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        description={`确定要删除项目 "${deleteConfirm.projectName}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
}