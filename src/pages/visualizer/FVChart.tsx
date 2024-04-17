import Highcharts from 'highcharts';
import { ReactNode } from 'react';
import { useStore } from '../../store.ts';
import { Chart } from './Chart.tsx';
import { ProsperitySymbol, FVLogRow } from '../../models.ts';

export interface FVChartProps {
  symbol: ProsperitySymbol;
}

export function FVChart({ symbol }: FVChartProps): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;
  const productData: FVLogRow[] = [];
  const series: Highcharts.SeriesOptionsType[] = [];
  let options: Highcharts.Options = {
    yAxis: [{
      opposite: false,
      allowDecimals: true,
    },]
  };

  console.log(symbol);

  if (symbol == "COMP_BASKET") {
    const compRow: FVLogRow[] = [];
    const basketRow: FVLogRow[] = [];
    for (const row of algorithm.fvLogs) {
      if (row.product === "COMP") {
        compRow.push(row)
      }
      else if (row.product === "BASKET") {
        basketRow.push(row)
      }
      else {
        continue;
      }
    }
  
    const compdataByTimestamp = new Map<number, Number>();
    for (const row of compRow) {
      if (!compdataByTimestamp.has(row.timestamp)) {
        compdataByTimestamp.set(row.timestamp, row.value);
      } else {
        compdataByTimestamp.set(row.timestamp, 0);
      }
    }

    const basketdataByTimestamp = new Map<number, Number>();
    for (const row of basketRow) {
      if (!basketdataByTimestamp.has(row.timestamp)) {
        basketdataByTimestamp.set(row.timestamp, row.value);
      } else {
        basketdataByTimestamp.set(row.timestamp, 0);
      }
    }
  
    series.push(
      {
        type: 'line',
        name: 'COMP',
        data: [...compdataByTimestamp.keys()].map(timestamp => [timestamp, compdataByTimestamp.get(timestamp)]),
      },
      {
        type: 'line',
        name: 'BASKET',
        data: [...basketdataByTimestamp.keys()].map(timestamp => [timestamp, basketdataByTimestamp.get(timestamp)]),
      },
    );

    options = {
      yAxis: [{
        opposite: false,
        allowDecimals: true,
      }]
    };
  }
  else if (symbol == 'ORCHIDS'){
    const prodRow: FVLogRow[] = [];
    const fvRow: FVLogRow[] = [];
    for (const row of algorithm.fvLogs) {
      if (row.product === "PRODUCTION") {
        prodRow.push(row)
      }
      else if (row.product === "ORCHIDS") {
        fvRow.push(row)
      }
      else {
        continue;
      }
    }
  
    const prodDataByTimestamp = new Map<number, Number>();
    for (const row of prodRow) {
      if (!prodDataByTimestamp.has(row.timestamp)) {
        prodDataByTimestamp.set(row.timestamp, row.value);
      } else {
        prodDataByTimestamp.set(row.timestamp, 0);
      }
    }

    const fvDataByTimestamp = new Map<number, Number>();
    for (const row of fvRow) {
      if (!fvDataByTimestamp.has(row.timestamp)) {
        fvDataByTimestamp.set(row.timestamp, row.value);
      } else {
        fvDataByTimestamp.set(row.timestamp, 0);
      }
    }
  
    series.push(
      {
        type: 'line',
        name: 'production',
        data: [...prodDataByTimestamp.keys()].map(timestamp => [timestamp, prodDataByTimestamp.get(timestamp)]),
        yAxis: 0,
      },
      {
        type: 'line',
        name: 'fv',
        data: [...fvDataByTimestamp.keys()].map(timestamp => [timestamp, fvDataByTimestamp.get(timestamp)]),
        yAxis: 1,
      },
    );

    options = {
      yAxis: [{
        opposite: false,
        allowDecimals: true,
      },
    {opposite: true, allowDecimals: true }]
    };
  }
  else {
    for (const row of algorithm.fvLogs) {
      if (row.product !== symbol) {
        continue;
      }
      else if (row.product in ['COMP_BASKET', 'ORCHIDS', 'PRODUCTION']) {
        continue;
      }
      else {
        productData.push(row);
      }
    }
  
    const dataByTimestamp = new Map<number, Number>();
    for (const row of productData) {
      if (!dataByTimestamp.has(row.timestamp)) {
        dataByTimestamp.set(row.timestamp, row.value);
      } else {
        dataByTimestamp.set(row.timestamp, 0);
      }
    }
  
    series.push(
      {
        type: 'line',
        name: 'Fair Value',
        data: [...dataByTimestamp.keys()].map(timestamp => [timestamp, dataByTimestamp.get(timestamp)]),
        yAxis: 0,
      },
    );
      const data = [];
  
      for (const row of productData) {
        data.push([row.timestamp, row.value]);
      }
  
      series.push({
        type: 'line',
        name: symbol,
        data,
        dashStyle: 'Dash',
        yAxis: 0
      });
    }

  return <Chart title={`${symbol} - Fair Value`} options={options} series={series} />;
}
