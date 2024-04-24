import { Center, Container, Grid, Title } from '@mantine/core';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store.ts';
import { formatNumber } from '../../utils/format.ts';
import { AlgorithmSummaryCard } from './AlgorithmSummaryCard.tsx';
import { ConversionPriceChart } from './ConversionPriceChart.tsx';
import { EnvironmentChart } from './EnvironmentChart.tsx';
import { PositionChart } from './PositionChart.tsx';
import { ProductPriceChart } from './ProductPriceChart.tsx';
import { ProfitLossChart } from './ProfitLossChart.tsx';
import { TimestampsCard } from './TimestampsCard.tsx';
import { TransportChart } from './TransportChart.tsx';
import { VisualizerCard } from './VisualizerCard.tsx';
import { VolumeChart } from './VolumeChart.tsx';
import { FVChart } from './FVChart.tsx';

export function VisualizerPage(): ReactNode {
  const algorithm = useStore(state => state.algorithm);

  const { search } = useLocation();

  if (algorithm === null) {
    return <Navigate to={`/${search}`} />;
  }

  const conversionProducts = new Set();
  for (const row of algorithm.data) {
    for (const product of Object.keys(row.state.observations.conversionObservations)) {
      conversionProducts.add(product);
    }
  }

  let profitLoss = 0;
  const lastTimestamp = algorithm.activityLogs[algorithm.activityLogs.length - 1].timestamp;
  for (let i = algorithm.activityLogs.length - 1; i >= 0 && algorithm.activityLogs[i].timestamp == lastTimestamp; i--) {
    profitLoss += algorithm.activityLogs[i].profitLoss;
  }

  const symbolColumns: ReactNode[] = [];
  Object.keys(algorithm.data[0].state.listings)
    .sort((a, b) => a.localeCompare(b))
    .forEach(symbol => {
      symbolColumns.push(
        <Grid.Col key={`${symbol} - product price`} span={{ xs: 12, sm: 6 }}>
          <ProductPriceChart symbol={symbol} />
        </Grid.Col>,
      );

      symbolColumns.push(
        <Grid.Col key={`${symbol} - symbol`} span={{ xs: 12, sm: 6 }}>
          <VolumeChart symbol={symbol} />
        </Grid.Col>,
      );

      if (symbol in ['PRODUCTION']) {
        return;
      }

      symbolColumns.push(
        <Grid.Col key={`${symbol} - Fair Value`} span={{ xs: 12, sm: 6 }}>
          <FVChart symbol={symbol} />
        </Grid.Col>,
      );

      if (!conversionProducts.has(symbol)) {
        return;
      }

      symbolColumns.push(
        <Grid.Col key={`${symbol} - conversion price`} span={{ xs: 12, sm: 6 }}>
          <ConversionPriceChart symbol={symbol} />
        </Grid.Col>,
      );

      symbolColumns.push(
        <Grid.Col key={`${symbol} - transport`} span={{ xs: 12, sm: 6 }}>
          <TransportChart symbol={symbol} />
        </Grid.Col>,
      );

      symbolColumns.push(
        <Grid.Col key={`${symbol} - environment`} span={{ xs: 12, sm: 6 }}>
          <EnvironmentChart symbol={symbol} />
        </Grid.Col>,
      );
    });
    
    symbolColumns.push(
      <Grid.Col key={`COMP & BASKET - Fair Value`} span={{ xs: 12, sm: 6 }}>
        <FVChart symbol='COMP_BASKET' />
      </Grid.Col>,
    );

    symbolColumns.push(
      <Grid.Col key={`MidPrice`} span={{ xs: 12, sm: 6 }}>
        <FVChart symbol='MIDPRICE' />
      </Grid.Col>,
    );
    /*
    symbolColumns.push(
      <Grid.Col key={`BASKET - COMP - FunctionDiff`} span={{ xs: 12, sm: 6 }}>
        <FVChart symbol='FunctionDiff' />
      </Grid.Col>,
    );
    */


  return (
    <Container fluid>
      <Grid>
        <Grid.Col span={12}>
          <VisualizerCard>
            <Center>
              <Title order={2}>Final Profit / Loss: {formatNumber(profitLoss)}</Title>
            </Center>
          </VisualizerCard>
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <ProfitLossChart />
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 6 }}>
          <PositionChart />
        </Grid.Col>
        {symbolColumns}
        <Grid.Col span={12}>
          <TimestampsCard />
        </Grid.Col>
        {algorithm.summary && (
          <Grid.Col span={12}>
            <AlgorithmSummaryCard />
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}
