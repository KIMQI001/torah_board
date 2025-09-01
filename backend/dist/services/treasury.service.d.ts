export interface TreasuryTransaction {
    id: string;
    daoId: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'REWARD' | 'FEE' | 'MILESTONE_PAYMENT';
    amount: number;
    token: string;
    from?: string;
    to?: string;
    description: string;
    proposalId?: string;
    projectId?: string;
    txHash?: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}
export interface TreasuryBalance {
    token: string;
    balance: number;
    usdValue: number;
}
export interface TreasuryMetrics {
    totalValue: number;
    totalIncome: number;
    totalExpenses: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    topTokens: TreasuryBalance[];
}
export declare class TreasuryService {
    /**
     * 获取DAO财务余额
     */
    static getDAOBalance(daoId: string): Promise<TreasuryBalance[]>;
    /**
     * 获取DAO财务指标
     */
    static getTreasuryMetrics(daoId: string): Promise<TreasuryMetrics>;
    /**
     * 创建资金转账请求
     */
    static createTransferRequest(daoId: string, type: TreasuryTransaction['type'], amount: number, token: string, to?: string, description?: string, proposalId?: string, projectId?: string): Promise<string>;
    /**
     * 确认转账交易
     */
    static confirmTransaction(transactionId: string, txHash: string): Promise<void>;
    /**
     * 处理里程碑付款
     */
    static processMilestonePayment(daoId: string, projectId: string, milestoneId: string, amount: number, recipientAddress: string): Promise<string>;
    /**
     * 处理项目投资分配
     */
    static allocateProjectFunding(daoId: string, projectId: string, amount: number): Promise<void>;
    /**
     * 获取代币价格（简化实现）
     */
    private static getTokenPrice;
    /**
     * 获取财务交易历史
     */
    static getTransactionHistory(daoId: string, limit?: number, offset?: number): Promise<TreasuryTransaction[]>;
    /**
     * 检查DAO是否有足够资金执行提案
     */
    static checkFundsAvailability(daoId: string, amount: number, token?: string): Promise<boolean>;
}
//# sourceMappingURL=treasury.service.d.ts.map