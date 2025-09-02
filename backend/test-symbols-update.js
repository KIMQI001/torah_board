const { ExchangeSymbolsService } = require('./dist/services/exchange-symbols.service');

console.log('开始测试交易所币种数据更新...');

ExchangeSymbolsService.updateSymbolsTask()
  .then(() => {
    console.log('交易所币种数据更新完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('更新失败:', error);
    process.exit(1);
  });