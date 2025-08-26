-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    "settings" TEXT
);

-- CreateTable
CREATE TABLE "depin_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenPrice" REAL NOT NULL DEFAULT 0,
    "marketCap" TEXT NOT NULL DEFAULT '$0',
    "volume24h" TEXT NOT NULL DEFAULT '$0',
    "apy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "minInvestment" REAL NOT NULL,
    "roiPeriod" INTEGER NOT NULL,
    "geographicFocus" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "hardwareRequirements" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" TEXT,
    "location" TEXT,
    "monitorUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SYNCING',
    "uptime" TEXT NOT NULL DEFAULT '0%',
    "earnings" TEXT NOT NULL DEFAULT '$0/day',
    "totalEarned" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hardware" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_nodes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "depin_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "node_performances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "cpuUsage" REAL NOT NULL,
    "memoryUsage" REAL NOT NULL,
    "diskUsage" REAL NOT NULL,
    "networkLatency" REAL NOT NULL,
    "bandwidthUp" REAL NOT NULL,
    "bandwidthDown" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "node_performances_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "user_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roi_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "hardwareCost" REAL NOT NULL,
    "monthlyCost" REAL NOT NULL,
    "estimatedMonthlyReward" REAL NOT NULL,
    "roiMonths" REAL NOT NULL,
    "annualROI" REAL NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roi_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "roi_calculations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "depin_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "depin_projects_name_key" ON "depin_projects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_nodes_userId_nodeId_key" ON "user_nodes"("userId", "nodeId");
