/* ParaCharts: Accessible Charts
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

import { customElement } from 'lit/decorators.js';
import { ParaChart } from '../lib/parachart/parachart';
import { SeriesAnalyzer } from '@fizz/series-analyzer';

@customElement('para-chart-ai')
export class ParaChartAi extends ParaChart {

  constructor() {
    console.log('AI-enhanced ParaChart created');
    super(SeriesAnalyzer);
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-chart-ai': ParaChartAi;
  }
}
