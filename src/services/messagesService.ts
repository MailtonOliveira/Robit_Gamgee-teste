import moment from "moment-timezone";

function getCurrentDateTime(): string {
  return moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");
}

export const buyOrderMessage = (
  symbol: string,
  executedQty: number,
  price: number
) => {
  return `Compra realizada: ${executedQty} ${symbol} por ${price} Horário [${getCurrentDateTime()}]`;
};

export const sellOrderMessage = (
  symbol: string,
  executedQty: number,
  price: number
) => {
  return `Venda realizada: ${executedQty} ${symbol} por ${price}`;
};

export const updateBalancesMessage = (
  asset: string,
  availableBalance: number
) => {
  return `Atualização de saldos - Ativo: ${asset}, Saldo disponível: ${availableBalance}, Horário [${getCurrentDateTime()}]`;
};
