/* ParaCharts: ParaStore Data Store
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

import type { Manifest } from "@fizz/paramanifest";

import { Model2D } from "./model2D";
import { AllSeriesData } from "./helpers";

export class ParaStore {
  private model: Model2D;
  
  constructor(private manifest: Manifest, data?: AllSeriesData) {
    const dataset = manifest.datasets[0];
    if (dataset.data.source === 'inline') {
      this.model = Model2D.fromManifest(manifest);
    } else if (data) {
      this.model = Model2D.fromAllSeriesData(data);
    } else {
      throw new Error('store lacks external or inline chart data')
    }

  }
}