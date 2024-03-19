

export const buyOrderMessage = (symbol: string, executedQty: number, price: number) => {
    return `Compra realizada: ${executedQty} ${symbol} por ${price}`;
  };
  
  export const sellOrderMessage = (symbol: string, executedQty: number, price: number) => {
    return `Venda realizada: ${executedQty} ${symbol} por ${price}`;
  };
  