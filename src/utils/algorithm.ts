import {
  ActivityLogRow,
  FVLogRow,
  OrchidProductionRow,
  Algorithm,
  AlgorithmDataRow,
  AlgorithmSummary,
  CompressedAlgorithmDataRow,
  CompressedListing,
  CompressedObservations,
  CompressedOrder,
  CompressedOrderDepth,
  CompressedTrade,
  CompressedTradingState,
  ConversionObservation,
  Listing,
  Observation,
  Order,
  OrderDepth,
  Product,
  ProsperitySymbol,
  Trade,
  TradingState,
} from '../models.ts';
import { authenticatedAxios } from './axios.ts';

function getColumnValues(columns: string[], indices: number[]): number[] {
  const values: number[] = [];

  for (const index of indices) {
    const value = columns[index];
    if (value !== '') {
      values.push(parseFloat(value));
    }
  }

  return values;
}

function getOrchidProduction(logLines: string[]): OrchidProductionRow[] {
  //console.log(logLines);
  const headerIndex = logLines.indexOf('Sandbox logs:');
  if (headerIndex === -1) {
    return [];
  }

  const rows: OrchidProductionRow[] = [];

  for (let i = headerIndex; i < logLines.length; i++) {
    const line = logLines[i];
    //console.log(line);
    if (!line.includes('lambdaLog')) {
      continue;
    }

    const index = line.indexOf('PRODUCTION:')
    if (headerIndex === -1) {
      return [];
    }

    const production = Number.parseFloat(line.substring(index+11, line.indexOf("\\", index)));
    const timestampLine = logLines[i+1]
    const timestamp = Number(timestampLine.trim().split('"timestamp": ').pop());
    //console.log(production + " ; " + timestamp);

    rows.push({
      timestamp: timestamp,
      value: production,
    });

    //console.log(`product: ${product}, fv: ${fv}, timestamp: ${timestamp},`);
  }

  return rows;
}

function getFVLogs(logLines: string[]): FVLogRow[] {
  //console.log(logLines);
  const headerIndex = logLines.indexOf('Sandbox logs:');
  if (headerIndex === -1) {
    return [];
  }

  const rows: FVLogRow[] = [];

  for (let i = headerIndex; i < logLines.length; i++) {
    const line = logLines[i];
    //console.log(line);
    if (!line.includes('lambdaLog')) {
      continue;
    }

    const searchStr = 'FV:';
    const indexes = [...line.matchAll(new RegExp(searchStr, 'gi'))].map(a => a.index);
    //console.log(indexes);
    
    indexes.forEach((index) => {
      const product = line.substring(index+4, line.indexOf(";", index));
      const fv = Number(line.substring(line.indexOf(";", index)+1, line.indexOf("\\", line.indexOf(";", index)+1)));
      const timestampLine = logLines[i+1]
      const timestamp = Number(timestampLine.trim().split('"timestamp": ').pop());
      //console.log(product + " ; " + fv + " ; " + timestamp);

      rows.push({
        timestamp: timestamp,
        product: product,
        value: fv,
      });
    })

    //console.log(`product: ${product}, fv: ${fv}, timestamp: ${timestamp},`);
  }

  return rows;
}

function getActivityLogs(logLines: string[]): ActivityLogRow[] {
  const headerIndex = logLines.indexOf('Activities log:');
  if (headerIndex === -1) {
    return [];
  }

  const rows: ActivityLogRow[] = [];

  for (let i = headerIndex + 2; i < logLines.length; i++) {
    const line = logLines[i];
    if (line === '') {
      break;
    }

    const columns = line.split(';');

    rows.push({
      day: Number(columns[0]),
      timestamp: Number(columns[1]),
      product: columns[2],
      bidPrices: getColumnValues(columns, [3, 5, 7]),
      bidVolumes: getColumnValues(columns, [4, 6, 8]),
      askPrices: getColumnValues(columns, [9, 11, 13]),
      askVolumes: getColumnValues(columns, [10, 12, 14]),
      midPrice: Number(columns[15]),
      profitLoss: Number(columns[16]),
    });
  }

  return rows;
}

function decompressListings(compressed: CompressedListing[]): Record<ProsperitySymbol, Listing> {
  const listings: Record<ProsperitySymbol, Listing> = {};

  for (const [symbol, product, denomination] of compressed) {
    listings[symbol] = {
      symbol,
      product,
      denomination,
    };
  }

  return listings;
}

function decompressOrderDepths(
  compressed: Record<ProsperitySymbol, CompressedOrderDepth>,
): Record<ProsperitySymbol, OrderDepth> {
  const orderDepths: Record<ProsperitySymbol, OrderDepth> = {};

  for (const [symbol, [buyOrders, sellOrders]] of Object.entries(compressed)) {
    orderDepths[symbol] = {
      buyOrders,
      sellOrders,
    };
  }

  return orderDepths;
}

function decompressTrades(compressed: CompressedTrade[]): Record<ProsperitySymbol, Trade[]> {
  const trades: Record<ProsperitySymbol, Trade[]> = {};

  for (const [symbol, price, quantity, buyer, seller, timestamp] of compressed) {
    if (trades[symbol] === undefined) {
      trades[symbol] = [];
    }

    trades[symbol].push({
      symbol,
      price,
      quantity,
      buyer,
      seller,
      timestamp,
    });
  }

  return trades;
}

function decompressObservations(compressed: CompressedObservations): Observation {
  const conversionObservations: Record<Product, ConversionObservation> = {};

  for (const [
    product,
    [bidPrice, askPrice, transportFees, exportTariff, importTariff, sunlight, humidity],
  ] of Object.entries(compressed[1])) {
    conversionObservations[product] = {
      bidPrice,
      askPrice,
      transportFees,
      exportTariff,
      importTariff,
      sunlight,
      humidity,
    };
  }

  return {
    plainValueObservations: compressed[0],
    conversionObservations,
  };
}

function decompressState(compressed: CompressedTradingState): TradingState {
  return {
    timestamp: compressed[0],
    traderData: compressed[1],
    listings: decompressListings(compressed[2]),
    orderDepths: decompressOrderDepths(compressed[3]),
    ownTrades: decompressTrades(compressed[4]),
    marketTrades: decompressTrades(compressed[5]),
    position: compressed[6],
    observations: decompressObservations(compressed[7]),
  };
}

function decompressOrders(compressed: CompressedOrder[]): Record<ProsperitySymbol, Order[]> {
  const orders: Record<ProsperitySymbol, Order[]> = {};

  for (const [symbol, price, quantity] of compressed) {
    if (orders[symbol] === undefined) {
      orders[symbol] = [];
    }

    orders[symbol].push({
      symbol,
      price,
      quantity,
    });
  }

  return orders;
}

function decompressDataRow(compressed: CompressedAlgorithmDataRow, sandboxLogs: string): AlgorithmDataRow {
  return {
    state: decompressState(compressed[0]),
    orders: decompressOrders(compressed[1]),
    conversions: compressed[2],
    traderData: compressed[3],
    algorithmLogs: compressed[4],
    sandboxLogs,
  };
}

function getAlgorithmData(logLines: string[]): AlgorithmDataRow[] {
  const headerIndex = logLines.indexOf('Sandbox logs:');
  if (headerIndex === -1) {
    return [];
  }

  const rows: AlgorithmDataRow[] = [];
  let nextSandboxLogs = '';

  const sandboxLogPrefix = '  "sandboxLog": ';
  const lambdaLogPrefix = '  "lambdaLog": ';

  for (let i = headerIndex + 1; i < logLines.length; i++) {
    const line = logLines[i];
    if (line.endsWith(':')) {
      break;
    }

    if (line.startsWith(sandboxLogPrefix)) {
      nextSandboxLogs = JSON.parse(line.substring(sandboxLogPrefix.length, line.length - 1)).trim();
      continue;
    }

    if (!line.startsWith(lambdaLogPrefix) || line === '  "lambdaLog": "",') {
      continue;
    }

    const start = line.indexOf('[[');
    const end = line.lastIndexOf(']') + 1;

    try {
      const compressedDataRow = JSON.parse(JSON.parse('"' + line.substring(start, end) + '"'));
      rows.push(decompressDataRow(compressedDataRow, nextSandboxLogs));
    } catch (err) {
      //console.log(line);
      console.error(err);
      throw new Error('Sandbox logs are in invalid format, please see the prerequisites section above.');
    }
  }

  return rows;
}

export function parseAlgorithmLogs(logs: string, summary?: AlgorithmSummary): Algorithm {
  
  
  const logLines = logs.trim().split(/\r?\n/);

  //console.log(logLines);

  const activityLogs = getActivityLogs(logLines);
  const data = getAlgorithmData(logLines);
  const fvLogs = getFVLogs(logLines);
  const orchidProductionLogs = getOrchidProduction(logLines);

  if (activityLogs.length === 0 || data.length === 0) {
    throw new Error('Logs are in invalid format, please see the prerequisites section above.');
  }

  return {
    summary,
    activityLogs,
    data,
    fvLogs,
    orchidProductionLogs,
  };
}

export async function getAlgorithmLogsUrl(algorithmId: string): Promise<string> {
  const urlResponse = await authenticatedAxios.get(
    `https://bz97lt8b1e.execute-api.eu-west-1.amazonaws.com/prod/submission/logs/${algorithmId}`,
  );

  return urlResponse.data;
}

function downloadFile(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = new URL(url).pathname.split('/').pop()!;
  link.target = '_blank';
  link.rel = 'noreferrer';

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadAlgorithmLogs(algorithmId: string): Promise<void> {
  const logsUrl = await getAlgorithmLogsUrl(algorithmId);
  downloadFile(logsUrl);
}

export async function downloadAlgorithmResults(algorithmId: string): Promise<void> {
  const detailsResponse = await authenticatedAxios.get(
    `https://bz97lt8b1e.execute-api.eu-west-1.amazonaws.com/prod/results/tutorial/${algorithmId}`,
  );

  downloadFile(detailsResponse.data.algo.summary.activitiesLog);
}
