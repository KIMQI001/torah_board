"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Dashboard() {
  const { t } = useLanguage();
  
  const stats = [
    {
      key: "dashboard.totalPortfolio",
      value: "$24,567.89",
      change: "+12.3%",
      trending: "up",
      icon: DollarSign,
    },
    {
      key: "dashboard.memeCoinsTracked",
      value: "142",
      change: "+23",
      trending: "up",
      icon: TrendingUp,
    },
    {
      key: "dashboard.activeAirdrops",
      value: "8",
      change: "2 new",
      trending: "up",
      icon: Users,
    },
    {
      key: "dashboard.arbitrageOpportunities",
      value: "3",
      change: "+150% profit",
      trending: "up",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.key)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {stat.trending === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.marketOverview")}</CardTitle>
            <CardDescription>
              {t("dashboard.marketOverviewDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("dashboard.chartPlaceholder")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>
              {t("dashboard.quickActionsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">{t("dashboard.checkAirdrops")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.pendingAirdrops")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t("dashboard.viewMemeTrends")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.memeTracked")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">{t("dashboard.arbitrageScanner")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.arbitrageOpportunitiesCount")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
