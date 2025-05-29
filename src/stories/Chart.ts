
//import { KeymapsInput } from '../../lib';
import { type SettingsInput, type LegendItemOrder } from '../../lib/store/settings_types';

import { html, nothing } from 'lit';
import '../../lib';
import { ChartType } from '@fizz/paramanifest';
import { DirectiveResult } from 'lit/async-directive.js';
import { UnsafeHTMLDirective } from 'lit/directives/unsafe-html.js';
import { DataAndTypes, KeymapsInput } from '@fizz/todocharts';

export interface ChartProps {
  filename: string;
  config?: SettingsInput;  
  legendOrder: LegendItemOrder;
  forcecharttype?: ChartType;
  slot?: DirectiveResult<typeof UnsafeHTMLDirective>;
  type?: string;
  //height: number;
  chartTitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  configFile?: string;
  data?: DataAndTypes;
  dataFile?: string;
  keybindings?: KeymapsInput;
  keybindingsFile?: string;
  summary?: string;
  debug?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const Chart = ({ 
  filename, config, legendOrder, forcecharttype, slot
}: ChartProps) => {
  console.log("chart loading")
  config ??= {};
  config['legend.itemOrder'] = legendOrder;
  console.log(slot)
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
    .config=${config ?? nothing}
    forcecharttype=${forcecharttype ?? nothing}
  >
    ${slot ?? ``}
    <span slot="settings"></span>
  </para-chart>
  `;
};
