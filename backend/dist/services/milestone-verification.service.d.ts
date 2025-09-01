export interface MilestoneVerification {
    id: string;
    milestoneId: string;
    projectId: string;
    daoId: string;
    verificationMethod: 'PEER_REVIEW' | 'AUTOMATED_CHECK' | 'EXTERNAL_AUDIT' | 'DELIVERABLE_SUBMISSION';
    requiredEvidence: string[];
    submittedEvidence: string[];
    verifiers: string[];
    verificationThreshold: number;
    currentApprovals: number;
    status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'PAYMENT_PROCESSED';
    submittedAt: Date;
    verificationDeadline: Date;
}
export interface VerificationReview {
    id: string;
    verificationId: string;
    reviewerId: string;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_EVIDENCE';
    comments: string;
    evidenceChecked: string[];
    votingPower: number;
    timestamp: Date;
}
export declare class MilestoneVerificationService {
    /**
     * 提交里程碑验证申请
     */
    static submitMilestoneForVerification(milestoneId: string, evidenceSubmission: {
        submittedEvidence: string[];
        verificationNotes?: string;
    }, submittedBy: string): Promise<string>;
    /**
     * 提交验证评审
     */
    static submitVerificationReview(verificationId: string, reviewerId: string, review: {
        decision: VerificationReview['decision'];
        comments: string;
        evidenceChecked: string[];
    }): Promise<void>;
    /**
     * 检查验证状态
     */
    private static checkVerificationStatus;
    /**
     * 验证里程碑
     */
    private static verifyMilestone;
    /**
     * 拒绝验证
     */
    private static rejectVerification;
    /**
     * 处理里程碑付款
     */
    private static processMilestonePayment;
    /**
     * 获取验证者的总投票权
     */
    private static getTotalVerifierVotingPower;
    /**
     * 确定验证方法
     */
    private static determineVerificationMethod;
    /**
     * 选择验证者
     */
    private static selectVerifiers;
    /**
     * 获取里程碑验证列表
     */
    static getMilestoneVerifications(daoId: string, status?: string, limit?: number, offset?: number): Promise<MilestoneVerification[]>;
    /**
     * 获取单个验证详情
     */
    static getMilestoneVerification(verificationId: string): Promise<MilestoneVerification | null>;
}
//# sourceMappingURL=milestone-verification.service.d.ts.map