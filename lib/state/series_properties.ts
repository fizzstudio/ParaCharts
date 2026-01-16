/* ParaCharts: Series Properties
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

import { type DataSymbolType } from '../view/symbol';
import { ParaState } from './parastate';

export class SeriesPropertyManager {

  private seriesList: SeriesProperties[];

  constructor(private paraState: ParaState) {
    this.seriesList = paraState.model!.series.map((series, i) => 
      new SeriesProperties(series.key, paraState.colors.wrapColorIndex(i), paraState.symbols.symbolAt(i)));
  }

  properties(key: string): SeriesProperties {
    const props = this.seriesList.find(series => series.key === key);
    if (!props) {
      throw new Error(`no properties for series key '${key}'`);
    }
    return props;
  }

}

export class SeriesProperties {

  constructor(public readonly key: string, public color: number, public symbol: DataSymbolType) { }

}