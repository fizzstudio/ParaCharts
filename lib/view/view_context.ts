/* ParaCharts: View Context Interface
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

import type { SVGTemplateResult, TemplateResult } from 'lit';
import type { Ref } from 'lit/directives/ref.js';
import type { ParaChart } from '../parachart/parachart';
import type { ParaState } from '../state';
import type { DocumentView } from './document_view';
import type { BrailleGrade } from '../braille/braille_translation_provider';

/**
 * Narrow host interface used by View and its subclasses.
 * ParaView implements this; tests can use a plain stub object.
 */
export interface ViewContext {
  readonly paraState: ParaState;
  readonly documentView: DocumentView | undefined;
  /** SVG root element, used for off-screen measurement. */
  readonly root: SVGSVGElement | undefined;
  /** Named SVG <defs> entries. */
  readonly defs: { [key: string]: TemplateResult };
  requestUpdate(): void;
  ref<T>(key: string): Ref<T>;
  createDocumentView(): void;
  computeViewBox(): void;
  addDef(key: string, template: SVGTemplateResult): void;
  translateBraille(text: string, grade: BrailleGrade): string;
}

/**
 * Extended host interface for data-layer views, which also need animation APIs.
 */
export interface DataLayerContext extends ViewContext {
  readonly paraChart: Pick<ParaChart, 'postNotice'>;
  clipWidth: number;
}
