/* ParaCharts: Series Properties
Copyright (C) 2025 Fizz Studio

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

  private _seriesList!: SeriesProperties[];

  constructor(private _paraState: ParaState, private _isCombo = false) {
  }

  get seriesList() {
    if (!this._seriesList) {
      this.reset();
    }
    return this._seriesList;
  }

  reset() {
    const model = this._isCombo ? this._paraState.comboModel : this._paraState.model;
    this._seriesList = model!.series.map((series, i) =>
      new SeriesProperties(
        series.key,
        this._paraState.colors.wrapColorIndex(this._isCombo
          ? i + this._paraState.seriesProperties.seriesList.length
          : i),
        this._paraState.symbols.symbolAt(i)));
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