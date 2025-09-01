/**
 * 迁移脚本：更新投票系统到新的角色基础权重分配
 */
declare function migrateVotingSystem(): Promise<void>;
/**
 * 回滚迁移（如果需要）
 */
declare function rollbackMigration(): Promise<void>;
export { migrateVotingSystem, rollbackMigration };
//# sourceMappingURL=migrate-voting-system.d.ts.map