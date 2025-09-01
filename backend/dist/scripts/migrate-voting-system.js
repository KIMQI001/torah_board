"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateVotingSystem = migrateVotingSystem;
exports.rollbackMigration = rollbackMigration;
const database_1 = require("../services/database");
const voting_weight_service_1 = require("../services/voting-weight.service");
/**
 * 迁移脚本：更新投票系统到新的角色基础权重分配
 */
async function migrateVotingSystem() {
    try {
        console.log('🚀 开始迁移投票系统...');
        // 步骤1：获取所有DAO
        const daos = await database_1.prisma.dAO.findMany({
            include: {
                members: {
                    where: { status: 'ACTIVE' }
                }
            }
        });
        console.log(`📊 找到 ${daos.length} 个DAO需要迁移`);
        for (const dao of daos) {
            console.log(`\n🏛️ 处理DAO: ${dao.name} (${dao.id})`);
            console.log(`   成员数量: ${dao.members.length}`);
            // 步骤2：为每个DAO指定Chair
            let chairAssigned = false;
            // 检查是否已经有Chair
            const existingChair = dao.members.find(m => m.role === 'CHAIR');
            if (existingChair) {
                console.log(`   ✅ 已有Chair: ${existingChair.address}`);
                chairAssigned = true;
            }
            else {
                // 寻找创建者或第一个管理员作为Chair
                let newChair = dao.members.find(m => m.userId === dao.createdBy);
                if (!newChair) {
                    newChair = dao.members.find(m => m.role === 'ADMIN');
                }
                if (!newChair && dao.members.length > 0) {
                    newChair = dao.members[0]; // 如果都没有，选择第一个成员
                }
                if (newChair) {
                    await database_1.prisma.dAOMember.update({
                        where: { id: newChair.id },
                        data: { role: 'CHAIR' }
                    });
                    console.log(`   👑 指定新Chair: ${newChair.address}`);
                    chairAssigned = true;
                }
            }
            if (!chairAssigned) {
                console.log(`   ⚠️ 无法为DAO ${dao.name} 指定Chair，跳过`);
                continue;
            }
            // 步骤3：确保至少有一个Admin
            const adminCount = dao.members.filter(m => m.role === 'ADMIN').length;
            if (adminCount === 0) {
                // 如果没有Admin，将第二个成员设为Admin
                const secondMember = dao.members.find(m => m.role !== 'CHAIR');
                if (secondMember) {
                    await database_1.prisma.dAOMember.update({
                        where: { id: secondMember.id },
                        data: { role: 'ADMIN' }
                    });
                    console.log(`   🔧 指定新Admin: ${secondMember.address}`);
                }
            }
            // 步骤4：重新计算所有成员的投票权重
            console.log(`   🔄 重新计算投票权重...`);
            const updatedMembers = await database_1.prisma.dAOMember.findMany({
                where: { daoId: dao.id, status: 'ACTIVE' }
            });
            for (const member of updatedMembers) {
                try {
                    await voting_weight_service_1.VotingWeightService.calculateVotingPower(member.id);
                }
                catch (error) {
                    console.error(`   ❌ 计算成员 ${member.address} 投票权重失败:`, error);
                }
            }
            // 步骤5：验证权重分配
            const finalMembers = await database_1.prisma.dAOMember.findMany({
                where: { daoId: dao.id, status: 'ACTIVE' }
            });
            let totalWeight = 0;
            let chairWeight = 0;
            let adminWeight = 0;
            let memberWeight = 0;
            for (const member of finalMembers) {
                totalWeight += member.votingPower;
                if (member.role === 'CHAIR')
                    chairWeight += member.votingPower;
                else if (member.role === 'ADMIN')
                    adminWeight += member.votingPower;
                else if (member.role === 'MEMBER')
                    memberWeight += member.votingPower;
            }
            console.log(`   📈 权重分配结果:`);
            console.log(`      Chair: ${chairWeight}%`);
            console.log(`      Admin: ${adminWeight}%`);
            console.log(`      Member: ${memberWeight}%`);
            console.log(`      总计: ${totalWeight}%`);
            // 验证权重分配是否正确
            if (Math.abs(totalWeight - 100) > 0.1) {
                console.log(`   ⚠️ 权重总和不等于100%: ${totalWeight}%`);
            }
            else {
                console.log(`   ✅ 权重分配正确`);
            }
        }
        // 步骤6：更新默认提案阈值
        console.log('\n🎯 更新提案默认阈值为31%...');
        await database_1.prisma.dAOProposal.updateMany({
            where: {
                status: { in: ['DRAFT', 'ACTIVE'] },
                threshold: { gt: 31 } // 只更新大于31%的提案
            },
            data: { threshold: 31 }
        });
        console.log('✅ 投票系统迁移完成！');
        // 生成迁移报告
        const finalStats = await generateMigrationReport();
        console.log('\n📋 迁移报告:');
        console.log(JSON.stringify(finalStats, null, 2));
    }
    catch (error) {
        console.error('❌ 迁移失败:', error);
        throw error;
    }
}
/**
 * 生成迁移报告
 */
async function generateMigrationReport() {
    const totalDAOs = await database_1.prisma.dAO.count();
    const totalMembers = await database_1.prisma.dAOMember.count({ where: { status: 'ACTIVE' } });
    const roleDistribution = await database_1.prisma.dAOMember.groupBy({
        by: ['role'],
        where: { status: 'ACTIVE' },
        _count: { role: true }
    });
    const avgVotingPower = await database_1.prisma.dAOMember.aggregate({
        where: { status: 'ACTIVE' },
        _avg: { votingPower: true }
    });
    return {
        totalDAOs,
        totalMembers,
        roleDistribution: roleDistribution.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
        }, {}),
        averageVotingPower: avgVotingPower._avg.votingPower
    };
}
/**
 * 回滚迁移（如果需要）
 */
async function rollbackMigration() {
    try {
        console.log('🔄 开始回滚迁移...');
        // 将所有Chair改回Admin
        await database_1.prisma.dAOMember.updateMany({
            where: { role: 'CHAIR' },
            data: { role: 'ADMIN' }
        });
        // 重置所有投票权重为0，让旧系统重新计算
        await database_1.prisma.dAOMember.updateMany({
            data: { votingPower: 0 }
        });
        console.log('✅ 迁移回滚完成');
    }
    catch (error) {
        console.error('❌ 回滚失败:', error);
        throw error;
    }
}
// 主执行函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    try {
        if (command === 'rollback') {
            await rollbackMigration();
        }
        else {
            await migrateVotingSystem();
        }
    }
    catch (error) {
        console.error('执行失败:', error);
        process.exit(1);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
// 如果直接运行此脚本
if (require.main === module) {
    main();
}
//# sourceMappingURL=migrate-voting-system.js.map