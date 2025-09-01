export interface FundingRequest {
    id: string;
    daoId: string;
    proposalId: string;
    requestType: 'PROJECT_FUNDING' | 'MILESTONE_PAYMENT' | 'EMERGENCY_FUND' | 'OPERATIONAL_EXPENSES';
    amount: number;
    token: string;
    recipient: string;
    purpose: string;
    justification: string;
    requiredDocuments: string[];
    attachments?: string[];
    status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
    reviewers: string[];
    approvalThreshold: number;
    currentApprovals: number;
    createdAt: Date;
    reviewDeadline: Date;
}
export interface FundingReview {
    reviewerId: string;
    requestId: string;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
    comments: string;
    attachments?: string[];
    votingPower: number;
    timestamp: Date;
}
export declare class FundingRequestService {
    /**
     * 创建资金申请
     */
    static createFundingRequest(daoId: string, proposalId: string, requestData: {
        requestType: FundingRequest['requestType'];
        amount: number;
        token: string;
        recipient: string;
        purpose: string;
        justification: string;
        requiredDocuments: string[];
        attachments?: string[];
        reviewDeadline?: Date;
    }, createdBy: string): Promise<string>;
    /**
     * 提交审查意见
     */
    static submitReview(requestId: string, reviewerId: string, review: {
        decision: FundingReview['decision'];
        comments: string;
        attachments?: string[];
    }): Promise<void>;
    /**
     * 检查审批状态
     */
    private static checkApprovalStatus;
    /**
     * 批准资金申请
     */
    private static approveFundingRequest;
    /**
     * 拒绝资金申请
     */
    private static rejectFundingRequest;
    /**
     * 获取审查者的总投票权
     */
    private static getTotalReviewerVotingPower;
    /**
     * 转换申请类型到转账类型
     */
    private static getTransferType;
    /**
     * 获取资金申请列表
     */
    static getFundingRequests(daoId: string, status?: string, limit?: number, offset?: number): Promise<FundingRequest[]>;
    /**
     * 获取单个资金申请详情
     */
    static getFundingRequest(requestId: string): Promise<FundingRequest | null>;
    /**
     * 执行已批准的资金申请
     */
    static executeFundingRequest(requestId: string, executorId: string): Promise<void>;
}
//# sourceMappingURL=funding-request.service.d.ts.map