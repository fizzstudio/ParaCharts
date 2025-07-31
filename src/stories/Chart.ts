
//import { KeymapsInput } from '../../lib';
import { type SettingsInput } from '../../lib/store/settings_types';

import { html, nothing, TemplateResult } from 'lit';
import '/lib';
import { ChartType } from '@fizz/paramanifest';
import '/lib-ai/index-ai.ts';

export interface ChartProps {
  filename: string;
  manifestType?: 'url' | 'fizz-chart-data';
  config?: SettingsInput;  
  forcecharttype?: ChartType;
  slot?: TemplateResult;
  legendOrder?: 'lexical' | 'chart';
  description?: string;
}

/**
 * Primary UI component for user interaction
 */
export const Chart = ({ 
  filename, config, forcecharttype, slot, legendOrder, description, manifestType
}: ChartProps) => {
  config ??= {};
  config['controlPanel.isControlPanelDefaultOpen'] = true;
  return html`
    <style>
      /*

      .chart .title {
        --para-margin: 40;
        --para-font-size: 30;
        --para-align: "start";
        --para-position: 'top';
      }

      
      .type .line {
        --para-is-draw-symbols: true;
        --para-line-width: 8;
      }

      .parachart {
        --para-palette: 'paratest', 'Para Custom Colors';
        --para-series-1-color: hsl(82, 77%, 40%), 'green';
        --para-series-2-color: hsl(273, 98%, 60%), 'purple';
        --para-series-0-color: hsl(38, 96%, 58%), 'orange';
        --para-series-3-color: hsl(22, 97%, 51%), 'red';
        --para-series-4-color: hsl(77, 98%, 25%), 'forest green';
      }

      .parachart {
        --para-series-0-symbol: 'star', 'outline';
        --para-series-1-symbol: 'diamond', 'outline';
        --para-series-2-symbol: 'plus', 'outline';
        --para-series-3-symbol: 'triangle_down', 'solid';
        --para-series-4-symbol: 'x', 'solid';
      }
        

      .chart {
        --para-has-legend-with-direct-labels: false;
        --para-has-direct-labels: true;
      }

      .legend {
        --para-is-always-draw-legend: true;
      }
              
      */

    </style>

  <para-chart 
    manifest=${filename}
    manifesttype=${manifestType ?? 'fizz-chart-data'} 
    .config=${config}
    forcecharttype=${forcecharttype ?? nothing}
    type=${forcecharttype ?? nothing}
    description=${description ?? nothing}
    data-testid="para-chart"
  >
    <slot>${slot ?? ``}</slot>
    <span slot="settings"></span>
  </para-chart>
  `;
};

export const AiChart = ({ 
  filename, config, forcecharttype, slot, legendOrder, description, manifestType
}: ChartProps) => {
  config ??= {};
  config['controlPanel.isControlPanelDefaultOpen'] = true;
  return html`
    <style>
      /*

      .chart .title {
        --para-margin: 40;
        --para-font-size: 30;
        --para-align: "start";
        --para-position: 'top';
      }

      
      .type .line {
        --para-is-draw-symbols: true;
        --para-line-width: 8;
      }

      .parachart {
        --para-palette: 'paratest', 'Para Custom Colors';
        --para-series-1-color: hsl(82, 77%, 40%), 'green';
        --para-series-2-color: hsl(273, 98%, 60%), 'purple';
        --para-series-0-color: hsl(38, 96%, 58%), 'orange';
        --para-series-3-color: hsl(22, 97%, 51%), 'red';
        --para-series-4-color: hsl(77, 98%, 25%), 'forest green';
      }

      .parachart {
        --para-series-0-symbol: 'star', 'outline';
        --para-series-1-symbol: 'diamond', 'outline';
        --para-series-2-symbol: 'plus', 'outline';
        --para-series-3-symbol: 'triangle_down', 'solid';
        --para-series-4-symbol: 'x', 'solid';
      }
        

      .chart {
        --para-has-legend-with-direct-labels: false;
        --para-has-direct-labels: true;
      }

      .legend {
        --para-is-always-draw-legend: true;
      }
              
      */

    </style>

  <para-chart-ai 
    manifest=${filename}
    manifesttype=${manifestType ?? 'fizz-chart-data'} 
    .config=${config}
    forcecharttype=${forcecharttype ?? nothing}
    description=${description ?? nothing}
    data-testid="para-chart"
  >
    <slot>${slot ?? ``}</slot>
    <span slot="settings"></span>
  </para-chart-ai>
  `;
};
