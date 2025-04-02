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

import { State, property } from "@lit-app/state";

import type { Manifest } from "@fizz/paramanifest";

import { Model2D } from "./model2D";
import { AllSeriesData } from "./helpers";

export class ParaStore extends State {

  @property()
  private manifest: Manifest;
  @property()
  private settings?: unknown;
  @property()
  private focused = 'chart';
  @property()
  private selected = null;
  @property()
  private queryLevel = 'default';

  private model: Model2D;
  
  constructor(manifest: Manifest, data?: AllSeriesData) {
    super();
    this.manifest = manifest;
    const dataset = this.manifest.datasets[0];
    if (dataset.data.source === 'inline') {
      this.model = Model2D.fromManifest(manifest);
    } else if (data) {
      this.model = Model2D.fromAllSeriesData(data);
    } else {
      throw new Error('store lacks external or inline chart data')
    }
  }

}
