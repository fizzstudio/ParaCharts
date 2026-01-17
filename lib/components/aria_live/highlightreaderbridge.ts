/* ParaCharts: Screen Reader Bridge for Highlighted Summaries
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

import { Highlight } from '@fizz/parasummary';
import { ScreenReaderBridge } from "./screenreaderbridge";

export class HighlightReaderBridge extends ScreenReaderBridge {
  public static readonly ORIGINAL_HIGHLIGHT_ATTRIBUTE = 'data-original-highlight';

  /**
   * Insert the provided text & highlights into the aria-live region.
   * @param text - the text to insert
   * @param highlights - the highlights to insert
   */
  public renderHighlights(text: string, highlights: Highlight[]): void {
    super.render(text);
    this._lastCreatedElement!.setAttribute(
      HighlightReaderBridge.ORIGINAL_HIGHLIGHT_ATTRIBUTE,
      JSON.stringify(highlights)
    );
  }
}