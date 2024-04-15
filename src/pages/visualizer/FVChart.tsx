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

  const series: Highcharts.SeriesOptionsType[] = [
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
  ];
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

        console.log(dataOrchids);
    
        series.push({
          type: 'line',
          name: 'dataOrchids',
          data: dataOrchids,//[...dataByTimestampOrchids.keys()].map(timestamp => [timestamp, dataByTimestampOrchids.get(timestamp)]),
          yAxis: 1
        },);
      }

      const options: Highcharts.Options = {
        yAxis: [{
          opposite: false,
          allowDecimals: true,
        },
      {opposite: true, allowDecimals: true, labels: {format: '{value:.4f}'} }]
      };


  return <Chart title={`${symbol} - Fair Value`} options={options} series={series} />;
}
