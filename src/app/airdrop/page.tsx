"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Calendar, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AirdropPage() {
  const { t } = useLanguage();
  
  const activeAirdrops = [
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
  ];

  const completedAirdrops = [
    {
      project: "Pyth Network",
      chain: "Solana",
      claimedDate: "2023-11-20",
      amount: "150 PYTH",
      value: "$180",
    },
    {
      project: "Jito MEV",
      chain: "Solana", 
      claimedDate: "2023-12-01",
      amount: "45 JTO",
      value: "$135",
    },
  ];

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
            <CardTitle className="text-sm font-medium">{t('airdrop.claimedRewards')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAirdrops.length}</div>
            <p className="text-xs text-muted-foreground">{t('airdrop.thisMonth')}</p>
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
            <CardTitle>{t('airdrop.activeAirdrops')}</CardTitle>
            <CardDescription>
              Complete requirements before deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAirdrops.map((airdrop) => (
                <div key={airdrop.project} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
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
                      Deadline: {new Date(airdrop.deadline).toLocaleDateString()}
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
            <CardTitle>{t('airdrop.claimedRewards')}</CardTitle>
            <CardDescription>
              Successfully claimed airdrops
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedAirdrops.map((airdrop) => (
                <div key={airdrop.project} className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{airdrop.project}</h3>
                      <p className="text-sm text-muted-foreground">{airdrop.chain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{airdrop.value}</p>
                      <p className="text-xs text-muted-foreground">Claimed value</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">{airdrop.amount}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(airdrop.claimedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {completedAirdrops.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4" />
                  <p>No completed claims yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}