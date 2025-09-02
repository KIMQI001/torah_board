import { ExchangeSymbolsService } from './src/services/exchange-symbols.service';

console.log('🚀 开始初始化交易所币种数据库...');

ExchangeSymbolsService.updateSymbolsTask()
  .then(() => {
    console.log('✅ 交易所币种数据更新完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  });