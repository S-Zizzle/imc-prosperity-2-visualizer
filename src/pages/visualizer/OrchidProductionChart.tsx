import Highcharts from 'highcharts';
import { ReactNode } from 'react';
import { useStore } from '../../store.ts';
import { Chart } from './Chart.tsx';
import { ProsperitySymbol, OrchidProductionRow } from '../../models.ts';

export function OrchidProductionChart(): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;

  const dataByTimestamp = new Map<number, number>();
  for (const row of algorithm.orchidProductionLogs) {
    if (!dataByTimestamp.has(row.timestamp)) {
      dataByTimestamp.set(row.timestamp, row.value);
    } else {
      dataByTimestamp.set(row.timestamp, 0);
    }
  }

  const series: Highcharts.SeriesOptionsType[] = [
    {
      type: 'line',
      name: 'Total',
      data: [...dataByTimestamp.keys()].map(timestamp => [timestamp, dataByTimestamp.get(timestamp)]),
    },
  ];


    const data = [];

    for (const row of algorithm.orchidProductionLogs) {
      data.push([row.timestamp, row.value]);
    }

    series.push({
      type: 'line',
      name: "ORCHID",
      data,
      dashStyle: 'Dash',
    });

  return <Chart title={`ORCHIDS - Production`} series={series} />;
}
