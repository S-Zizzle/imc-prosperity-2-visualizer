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

  if (symbol == "COMP+BASKET") {
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
        yAxis: 0,
      },
      {
        type: 'line',
        name: 'BASKET',
        data: [...basketdataByTimestamp.keys()].map(timestamp => [timestamp, basketdataByTimestamp.get(timestamp)]),
        yAxis: 1,
      },
    );
    
    const compdata = [];
    const basketdata = [];
  
    for (const row of compRow) {
      compdata.push([row.timestamp, row.value]);
    }

    for (const row of basketRow) {
      basketdata.push([row.timestamp, row.value]);
    }

    series.push({
      type: 'line',
      name: symbol,
      data: compdata,
      dashStyle: 'Dash',
      yAxis: 0
    });

    series.push({
      type: 'line',
      name: symbol,
      data: basketdata,
      dashStyle: 'Dash',
      yAxis: 1
    });
  }
  else {
    for (const row of algorithm.fvLogs) {
      if (row.product !== symbol) {
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
      {
        type: 'line',
        name: 'Production',
        data: [...dataByTimestamp.keys()].map(timestamp => [timestamp, dataByTimestamp.get(timestamp)]),
        yAxis: 1,
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
  
  
  
    if (symbol == "ORCHIDS"){
      const dataByTimestampOrchids = new Map<number, Number>();
      for (const row of algorithm.orchidProductionLogs) {
        if (!dataByTimestampOrchids.has(row.timestamp)) {
          dataByTimestampOrchids.set(row.timestamp, row.value);
        } else {
          dataByTimestampOrchids.set(row.timestamp, 0);
        }
      }
  
      const dataOrchids = [];
  
      for (const row of algorithm.orchidProductionLogs) {
        dataOrchids.push([row.timestamp, row.value]);
      }
  
      series.push({
        type: 'line',
        name: 'dataOrchids',
        data: dataOrchids,//[...dataByTimestampOrchids.keys()].map(timestamp => [timestamp, dataByTimestampOrchids.get(timestamp)]),
        yAxis: 1
      },);
    }
  }


  const options: Highcharts.Options = {
    yAxis: [{
      opposite: false,
      allowDecimals: true,
    },
  {opposite: true, allowDecimals: true }]
  };

  return <Chart title={`${symbol} - Fair Value`} options={options} series={series} />;
}
