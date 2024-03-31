import axios from "axios";

interface LotSizeFilter {
  filterType: string;
  stepSize: string;
}

interface SymbolInfo {
  symbol: string;
  filters: LotSizeFilter[];
}

export class ExchangeInfoController {
  static async getExchangeInfo(symbol: string): Promise<SymbolInfo | undefined> {
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/exchangeInfo`);
      const exchangeInfo = response.data;
      const symbolInfo = exchangeInfo.symbols.find((s: any) => s.symbol === symbol);
      return symbolInfo;
    } catch (error) {
      console.error("Erro ao obter informações de troca:", error);
      return undefined;
    }
  }

  static adjustOrderQuantity(quantity: number, stepSize: number): number {
    return Math.floor(quantity / stepSize) * stepSize;
  }
}
