
//import { KeymapsInput } from '../../lib';
import { type SettingsInput } from '../../lib/store/settings_types';

import { html, nothing } from 'lit';
import '../../lib';

export interface ChartProps {
  filename: string;
}

/**
 * Primary UI component for user interaction
 */
export const Chart = ({ 
  filename
}: ChartProps) => {
  console.log(`Storybook: filename: '${filename}'`)
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
    filename=${filename} 
  >
    <span slot="settings"></span>
  </para-chart>
  `;
};
