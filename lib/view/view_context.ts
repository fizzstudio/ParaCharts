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
import type { ParaState } from '../state';
import type { DocumentView } from './document_view';

/**
 * The narrow interface that {@link View} and its subclasses need from the
 * host element (ParaView). Using this interface instead of the concrete
 * ParaView class keeps the view layer decoupled from the custom-element
 * implementation and makes unit-testing view trees possible with simple
 * stub objects.
 *
 * The concrete `ParaView` class implements this interface.
 */
export interface ViewContext {
  /** Application state accessed by views for rendering decisions. */
  readonly paraState: ParaState;

  /** The root document view, available after {@link createDocumentView}. */
  readonly documentView: DocumentView | undefined;

  /** The SVG root element, used for off-screen measurement. */
  readonly root: SVGSVGElement | undefined;

  /** Named SVG `<defs>` entries, keyed by an opaque string. */
  readonly defs: { [key: string]: TemplateResult };

  /** Trigger a Lit re-render of the host element. */
  requestUpdate(): void;

  /** Look up (or create) a named Lit {@link Ref} for an SVG element. */
  ref<T>(key: string): Ref<T>;

  /** (Re)build the {@link DocumentView} tree from current state. */
  createDocumentView(): void;

  /** Recompute the SVG viewBox after layout changes. */
  computeViewBox(): void;

  /** Register a named SVG `<defs>` entry. Throws if key already registered. */
  addDef(key: string, template: SVGTemplateResult): void;
}
