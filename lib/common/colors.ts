/* ParaCharts: Color Types
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

import { svg, TemplateResult } from 'lit';
import { type ParaState } from '../state';

export interface Palette {
  key: string;
  title: string;
  description?: string;
  cvd?: boolean;
  colors: Color[];
  patterns?: Pattern[];
  isPattern?: boolean;
}

interface Key {
  id?: string;
  index: number;
  base: string | null;
  light: null;
  dark: null;
}

interface Record {
  index: number;
  base: null;
  light: null;
  dark: null;
}

export interface Color {
  value: string;
  name: string;
  contrastValue?: string;
}

export interface Pattern {
  value: TemplateResult;
  name: string;
  contrastValue?: string;
}

export class Colors {
  readonly palettes: Palette[];
  keys = new Map<string, Key>();

  protected _colorMap: number[] | null = null;

  //private paletteIndex = 0;
  private primary = 'hsl(270, 50%, 50%)';
  private accent = 'hsl(270, 50%, 25%)';
  private active = 'hsl(270, 50%, 65%)';
  protected _prevSelectedColor: string = ''

  constructor(protected _paraState: ParaState) {
    this.palettes = [
      {
        key: 'diva',
        title: 'Diva',
        description: 'Primary palette.',
        colors: [
          {
            value: 'hsl(207, 43%, 40%)',
            name: 'blue',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(13, 40%, 46%)',
            name: 'red',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(102, 24%, 39%)',
            name: 'green',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(276, 18%, 47%)',
            name: 'purple',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(177, 33%, 35%)',
            name: 'teal',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(37, 57%, 45%)',
            name: 'amber',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(208, 35%, 62%)',
            name: 'sky blue',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(65, 26%, 37%)',
            name: 'olive',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(30, 52%, 45%)',
            name: 'ochre',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(40, 22%, 55%)',
            name: 'khaki',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(85, 65%, 36%)',
            name: 'forest green'
          },
          {
            value: 'hsl(12, 56%, 51%)',
            name: 'red-orange'
          },
          {
            value: 'hsl(30, 42%, 35%)',
            name: 'brown'
          },
          {
            value: 'hsl(240, 100%, 50%)',
            name: 'bright blue'
          },
          {
            value: 'hsl(120, 100%, 50%)',
            name: 'lime green'
          },
          {
            value: 'hsl(39, 100%, 50%)',
            name: 'orange',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(300, 100%, 25%)',
            name: 'royal purple'
          },
          {
            value: 'hsl(51, 100%, 50%)',
            name: 'lemon yellow'
          },
          {
            value: 'hsl(328, 100%, 54%)',
            name: 'fuschia'
          },
          {
            value: 'hsl(177, 70%, 41%)',
            name: 'cyan'
          },
          {
            value: 'hsl(234, 20.5%, 47.8%)',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'original',
        title: 'Original',
        description: 'Original Diva palette.',
        colors: [
          {
            value: 'hsl(227, 26%, 52%)',
            name: 'blue-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(13, 58%, 35%)',
            name: 'red-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(109, 93%, 24%)',
            name: 'green-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(300, 50%, 50%)',
            name: 'purple-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(180, 100%, 25%)',
            name: 'blue-green-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(40, 98%, 69%)',
            name: 'yellow',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(215, 37%, 66%)',
            name: 'light blue',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(63, 100%, 23%)',
            name: 'olive green',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(34, 57%, 46%)',
            name: 'caramel',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(51, 56%, 64%)',
            name: 'tan',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(85, 65%, 36%)',
            name: 'forest green'
          },
          {
            value: 'hsl(12, 56%, 51%)',
            name: 'red-orange'
          },
          {
            value: 'hsl(30, 42%, 35%)',
            name: 'brown'
          },
          {
            value: 'hsl(240, 100%, 50%)',
            name: 'bright blue'
          },
          {
            value: 'hsl(120, 100%, 50%)',
            name: 'lime green'
          },
          {
            value: 'hsl(39, 100%, 50%)',
            name: 'orange',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(300, 100%, 25%)',
            name: 'royal purple'
          },
          {
            value: 'hsl(51, 100%, 50%)',
            name: 'lemon yellow'
          },
          {
            value: 'hsl(328, 100%, 54%)',
            name: 'fuschia'
          },
          {
            value: 'hsl(177, 70%, 41%)',
            name: 'cyan'
          },
          {
            value: 'hsl(234, 20.5%, 47.8%)',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'warm',
        title: 'warm hues (color-blind safe)',
        colors: [
          {
            value: 'hsl(38, 96%, 58%)',
            name: 'orange'
          },
          {
            value: 'hsl(82, 77%, 40%)',
            name: 'green'
          },
          {
            value: 'hsl(54, 81%, 73%)',
            name: 'yellow'
          },
          {
            value: 'hsl(22, 97%, 51%)',
            name: 'red'
          },
          {
            value: 'hsl(77, 98%, 25%)',
            name: 'forest green'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'cold',
        title: 'cold hues (color-blind safe)',
        colors: [
          {
            value: 'hsl(223, 100%, 70%)',
            name: 'blue'
          },
          {
            value: 'hsl(331, 72%, 51%)',
            name: 'pink'
          },
          {
            value: 'hsl(23, 100%, 50%)',
            name: 'tangerine'
          },
          {
            value: 'hsl(251, 83%, 65%)',
            name: 'purple'
          },
          {
            value: 'hsl(41, 100%, 50%)',
            name: 'orange'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          },
        ]
      },
      {
        key: 'rainbow',
        title: 'rainbow (color-blind safe)',
        colors: [
          {
            value: 'hsl(270, 100%, 29%)',
            name: 'purple'
          },
          {
            value: 'hsl(330, 100%, 71%)',
            name: 'pink'
          },
          {
            value: 'hsl(30, 100%, 43%)',
            name: 'cinnamon'
          },
          {
            value: 'hsl(180, 100%, 14%)',
            name: 'green'
          },
          {
            value: 'hsl(210, 100%, 43%)',
            name: 'blue'
          },
          {
            value: 'hsl(0, 100%, 29%)',
            name: 'red'
          },
          {
            value: 'hsl(120, 100%, 57%)',
            name: 'pale green'
          },
          {
            value: 'hsl(60, 100%, 71%)',
            name: 'pale yellow'
          },
          {
            value: 'hsl(330, 100%, 86%)',
            name: 'pale pink'
          },
          {
            value: 'hsl(210, 100%, 86%)',
            name: 'pale blue'
          },
          {
            value: 'hsl(30, 100%, 29%)',
            name: 'brown'
          },
          {
            value: 'hsl(180, 100%, 29%)',
            name: 'blue-gree'
          },
          {
            value: 'hsl(270, 100%, 71%)',
            name: 'lavendar'
          },
          {
            value: 'hsl(210, 100%, 71%)',
            name: 'light blue'
          },
          {
            value: 'hsl(0, 0%, 0%)',
            name: 'black'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'semantic',
        title: 'semantic colors',
        colors: [
          {
            value: 'hsl(109, 93%, 24%)',
            name: 'positive',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(13, 58%, 35%)',
            name: 'negative',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(227, 26%, 52%)',
            name: 'neutral',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          },
        ]
      },
      {
        key: 'grayscale-value',
        title: 'Grayscale',
        description: 'Full-color palette optimized for grayscale value roles.',
        colors: [
          {
            value: 'hsl(209, 10%, 40%)',
            name: 'blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(0, 0%, 52%)',
            name: 'red',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(113, 4%, 44%)',
            name: 'green',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(276, 9%, 57%)',
            name: 'purple',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(189, 6%, 43%)',
            name: 'teal',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(0, 0%, 65%)',
            name: 'amber',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'hsl(216, 9%, 78%)',
            name: 'sky blue',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'hsl(80, 3%, 36%)',
            name: 'olive',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(32, 6%, 57%)',
            name: 'ochre',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(44, 11%, 81%)',
            name: 'khaki',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'deutan',
        title: 'Deutan',
        description: 'Adjusted for deuteranopia.',
        cvd: true,
        colors: [
          {
            value: 'hsl(207, 43%, 40%)',
            name: 'blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(10, 41%, 49%)',
            name: 'red',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(146, 23%, 40%)',
            name: 'green',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(295, 22%, 46%)',
            name: 'purple',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(185, 61%, 36%)',
            name: 'teal',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(38, 60%, 45%)',
            name: 'amber',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(207, 42%, 63%)',
            name: 'sky blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(88, 24%, 37%)',
            name: 'olive',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(29, 55%, 46%)',
            name: 'ochre',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(41, 24%, 56%)',
            name: 'khaki',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'protan',
        title: 'Protan',
        description: 'Adjusted for protanopia.',
        cvd: true,
        colors: [
          {
            value: 'hsl(206, 54%, 40%)',
            name: 'blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(13, 49%, 48%)',
            name: 'red',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(165, 27%, 38%)',
            name: 'green',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(331, 30%, 45%)',
            name: 'purple',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(177, 54%, 35%)',
            name: 'teal',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(38, 60%, 45%)',
            name: 'amber',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(209, 34%, 58%)',
            name: 'sky blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(117, 10%, 39%)',
            name: 'olive',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(28, 54%, 45%)',
            name: 'ochre',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(41, 24%, 56%)',
            name: 'khaki',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'tritan',
        title: 'Tritan',
        description: 'Adjusted for tritanopia.',
        cvd: true,
        colors: [
          {
            value: 'hsl(202, 43%, 50%)',
            name: 'blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(353, 52%, 54%)',
            name: 'red',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(140, 14%, 43%)',
            name: 'green',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(274, 15%, 45%)',
            name: 'purple',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(186, 48%, 36%)',
            name: 'teal',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(10, 44%, 56%)',
            name: 'amber',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(197, 34%, 58%)',
            name: 'sky blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(317, 6%, 46%)',
            name: 'olive',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(14, 44%, 51%)',
            name: 'ochre',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(251, 10%, 68%)',
            name: 'khaki',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'grayscale',
        title: 'Gray',
        description: 'Achromatopsia / grayscale targets. Categorical, not sequential.',
        cvd: true,
        colors: [
          {
            value: 'hsl(205, 44%, 41%)',
            name: 'blue',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(8, 33%, 48%)',
            name: 'red',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(110, 14%, 42%)',
            name: 'green',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(270, 12%, 58%)',
            name: 'purple',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(182, 17%, 41%)',
            name: 'teal',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(37, 35%, 61%)',
            name: 'amber',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(211, 23%, 77%)',
            name: 'sky blue',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'hsl(63, 10%, 37%)',
            name: 'olive',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(33, 14%, 54%)',
            name: 'ochre',
            contrastValue: 'hsl(0, 0%, 100%)'
          },
          {
            value: 'hsl(41, 15%, 80%)',
            name: 'khaki',
            contrastValue: 'hsl(0, 0%, 0%)'
          },
          {
            value: 'cyan',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
      {
        key: 'pattern',
        title: 'pattern',
        isPattern: true,
        colors: [
          { value: 'hsl(225, 30%, 52%)', name: 'blue' },
          { value: 'hsl(12, 69%, 35%)', name: 'red' },
          { value: 'hsl(75, 43%, 45%)', name: 'green' },
          { value: 'hsl(40, 98%, 69%)', name: 'yellow' },
          { value: 'hsl(215, 37%, 66%)', name: 'light blue' },
          { value: 'hsl(63, 100%, 23%)', name: 'olive green' },
          { value: 'hsl(34, 57%, 46%)', name: 'caramel' },
          { value: 'hsl(51, 56%, 64%)', name: 'tan' },
          { value: 'hsl(253, 26%, 43%)', name: 'purple' },
          { value: 'hsl(85, 65%, 36%)', name: 'forest green' },
          { value: 'hsl(12, 56%, 51%)', name: 'red-orange' },
          { value: 'hsl(30, 42%, 35%)', name: 'brown' },
          { value: 'hsl(240, 100%, 50%)', name: 'bright blue' },
          { value: 'hsl(120, 100%, 50%)', name: 'lime green' },
          { value: 'hsl(39, 100%, 50%)', name: 'orange' },
          { value: 'hsl(300, 100%, 25%)', name: 'royal purple' },
          { value: 'hsl(51, 100%, 50%)', name: 'lemon yellow' },
          { value: 'hsl(328, 100%, 54%)', name: 'fuschia' },
          { value: 'hsl(177, 70%, 41%)', name: 'cyan' },
          { value: 'cyan', name: 'highlight' },
          { value: 'hsl(0, 100%, 50%)', name: 'visit' }
        ],
        // Pattern colors are hardcoded as SVG presentation attributes (stroke="hsl(...)",
        // fill="hsl(...)") rather than CSS custom properties. This is intentional: var()
        // references are not valid in SVG presentation attributes — they only work in CSS
        // property values (i.e. in a style="" attribute or a stylesheet rule). As a result,
        // the --color-palette-series-N vars injected by paletteVars() have no effect on
        // pattern colors. To make pattern colors CSS-editable in static exports, the
        // presentation attributes would need to be replaced with style="stroke: var(...)"
        // on each path/circle/rect inside the <pattern> elements. That change was deferred
        // because pattern palette colors are deliberately chosen for accessibility (contrast,
        // distinguishability) and making them freely editable via CSS risks undermining that.
        patterns: [
          {
            value: svg`
              <pattern id="Pattern0" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="hsl(225, 20%, 85%)" stroke="none" />
                <path d="M-2 8L8-2M-2 2L2-2M4 8L8 4"
                  stroke="hsl(225, 40%, 35%)" stroke-width="1.4" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'diagonal'
          },
          {
            value: svg`
              <pattern id="Pattern1" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="hsl(12, 50%, 80%)" stroke="none" />
                <circle cx="3" cy="3" r="1.1" fill="hsl(12, 70%, 22%)" stroke="none" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'dot'
          },
          {
            value: svg`
              <pattern id="Pattern2" patternUnits="userSpaceOnUse" width="12" height="6">
                <rect width="12" height="6" fill="hsl(75, 30%, 80%)" stroke="none" />
                <path d="M-3 3 C-1.5 1, 1.5 1, 3 3 S7.5 5, 9 3 S13.5 1, 15 3"
                  fill="none" stroke="hsl(75, 50%, 28%)" stroke-width="1.35"
                  stroke-linecap="round" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'wave'
          },
          {
            value: svg`
              <pattern id="Pattern3" patternUnits="userSpaceOnUse" width="5" height="5">
                <rect width="5" height="5" fill="hsl(40, 70%, 88%)" stroke="none" />
                <path d="M2.5 0V5" stroke="hsl(40, 100%, 42%)" stroke-width="1.5" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'vertical'
          },
          {
            value: svg`
              <pattern id="Pattern4" patternUnits="userSpaceOnUse" width="9" height="9">
                <rect width="9" height="9" fill="hsl(215, 25%, 88%)" stroke="none" />
                <circle cx="2.25" cy="2.25" r="1.7" fill="none"
                  stroke="hsl(215, 50%, 40%)" stroke-width="1.0" />
                <circle cx="6.75" cy="6.75" r="1.7" fill="none"
                  stroke="hsl(215, 50%, 40%)" stroke-width="1.0" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'ring'
          },
          {
            value: svg`
              <pattern id="Pattern5" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="hsl(63, 60%, 78%)" stroke="none" />
                <path d="M-2 8L8-2M-2-2L8 8"
                  stroke="hsl(63, 100%, 14%)" stroke-width="1" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'crosshatch'
          },
          {
            value: svg`
              <pattern id="Pattern6" patternUnits="userSpaceOnUse" width="6" height="8">
                <rect width="6" height="8" fill="hsl(34, 40%, 82%)" stroke="none" />
                <path d="M3-4 L1 0 L5 4 L1 8 L5 12"
                  fill="none" stroke="hsl(34, 65%, 28%)" stroke-width="1.35"
                  stroke-linejoin="round" stroke-linecap="round" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'vertical_zigzag'
          },
          {
            value: svg`
              <pattern id="Pattern7" patternUnits="userSpaceOnUse" width="12" height="12">
                <rect width="12" height="12" fill="hsl(51, 40%, 88%)" stroke="none" />
                <path d="M-2-2L14 14 M-2 10L2 14 M10-2L14 2"
                  stroke="hsl(51, 65%, 38%)" stroke-width="3.3" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'reverse_stripe'
          },
          {
            value: svg`
              <pattern id="Pattern8" patternUnits="userSpaceOnUse" width="5" height="5">
                <rect width="5" height="5" fill="hsl(253, 20%, 82%)" stroke="none" />
                <path d="M0 2.5H5" stroke="hsl(253, 35%, 25%)" stroke-width="1.5" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'horizontal'
          },
          {
            value: svg`
              <pattern id="Pattern9" patternUnits="userSpaceOnUse" width="10" height="10">
                <rect width="10" height="10" fill="hsl(85, 40%, 78%)" stroke="none" />
                <path d="M0 0H5V5H0Z M5 5H10V10H5Z"
                  fill="hsl(85, 75%, 20%)" stroke="none" />
              </pattern>`,
            contrastValue: "hsl(0, 0%, 0%)",
            name: 'checker'
          },
          {
            value: svg`hsl(0, 100%, 50%)`,
            name: 'visit'
          }
        ]
      },
      {
        key: 'low-vision',
        title: 'low-vision',
        colors: [
          {
            value: 'hsl(240, 100%, 60%)',
            name: 'blue-2',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(13, 58%, 35%)',
            name: 'red-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(120, 100%, 33%)',
            name: 'green-2',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(300, 77%, 54%)',
            name: 'magenta-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(39, 100%, 31%)',
            name: 'brown-1',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(40, 98%, 69%)',
            name: 'yellow',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(215, 37%, 66%)',
            name: 'light blue',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(63, 100%, 23%)',
            name: 'olive green',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(34, 57%, 46%)',
            name: 'caramel',
            contrastValue: `hsl(0, 0%, 100%)`
          },
          {
            value: 'hsl(51, 56%, 64%)',
            name: 'tan',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(85, 65%, 36%)',
            name: 'forest green'
          },
          {
            value: 'hsl(12, 56%, 51%)',
            name: 'red-orange'
          },
          {
            value: 'hsl(30, 42%, 35%)',
            name: 'brown'
          },
          {
            value: 'hsl(240, 100%, 50%)',
            name: 'bright blue'
          },
          {
            value: 'hsl(120, 100%, 50%)',
            name: 'lime green'
          },
          {
            value: 'hsl(39, 100%, 50%)',
            name: 'orange',
            contrastValue: `hsl(0, 0%, 0%)`
          },
          {
            value: 'hsl(300, 100%, 25%)',
            name: 'royal purple'
          },
          {
            value: 'hsl(51, 100%, 50%)',
            name: 'lemon yellow'
          },
          {
            value: 'hsl(328, 100%, 54%)',
            name: 'fuschia'
          },
          {
            value: 'hsl(177, 70%, 41%)',
            name: 'cyan'
          },
          {
            value: 'hsl(234, 20.5%, 47.8%)',
            name: 'highlight'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'visit'
          }
        ]
      },
    ];
    if (_paraState.config.color.colorMap) {
      this.setColorMap(..._paraState.config.color.colorMap.split(',').map(c => c.trim()));
    }
  }

  get paletteKey() {
    return this._paraState.config.color.colorVisionMode === 'normal'
      ? this._paraState.config.color.colorPalette
      : this._paraState.config.color.colorVisionMode;
  }

  get palette() {
    const palette = this.paletteKey === 'custom'
      ? this._makeCustomPalette()
      : this.palettes[this.indexOfPalette(this.paletteKey)];
    if (palette) {
      return palette;
    }
    throw new Error(`no palette named '${this.paletteKey}'`);
  }

  protected _makeCustomPalette(): Palette {
    const pal = {
      key: 'custom',
      title: 'custom',
      colors: [
        {
          value: this._paraState.config.color.custom1 || this.palettes[0].colors[0].value,
          name: 'custom-1'
        },
        {
          value: this._paraState.config.color.custom2 || this.palettes[0].colors[1].value,
          name: 'custom-2'
        },
        {
          value: this._paraState.config.color.custom3 || this.palettes[0].colors[2].value,
          name: 'custom-3'
        },
        {
          value: this._paraState.config.color.custom4 || this.palettes[0].colors[3].value,
          name: 'custom-4'
        },
        {
          value: this._paraState.config.color.custom5 || this.palettes[0].colors[4].value,
          name: 'custom-5'
        },
        {
          value: this._paraState.config.color.custom6 || this.palettes[0].colors[5].value,
          name: 'custom-6'
        },
        {
          value: this._paraState.config.color.custom7 || this.palettes[0].colors[6].value,
          name: 'custom-7'
        },
        {
          value: this._paraState.config.color.custom8 || this.palettes[0].colors[7].value,
          name: 'custom-8'
        },
        {
          value: 'cyan',
          name: 'highlight'
        },
        {
          value: 'hsl(0, 100%, 50%)',
          name: 'visit'
        }
      ]
    };
    return pal;
  }

  get prevSelectedColor() {
    return this._prevSelectedColor
  }

  setColorMap(...colors: string[]) {
    if (!colors.includes('visit')) {
      colors.push('visit');
    }
    for (const color of colors) {
      const idx = this.colorIndex(color);
      if (idx === -1) {
        throw new Error(`no color named '${color}' in current palette`);
      }
      if (!this._colorMap) {
        this._colorMap = [];
      }
      this._colorMap.push(idx);
    }
  }

  addPalette(palette: Palette) {
    this.palettes.push(palette);
  }

  indexOfPalette(key: string) {
    return this.palettes.findIndex(p => p.key === key);
  }

  colorAt(index: number) {
    return this.palette.colors[index]?.name ?? 'default';
  }

  /**
   * Wrap color index if out of range.
   * @param index - The color index to wrap
   * @returns valid index
   */
  wrapColorIndex(index: number) {
    return index % this.palette.colors.length;
  }

  /**
   * Get palette index of a color.
   * @param name - The name of the color to look up
   * @returns index or -1 if not found
   */
  colorIndex(name: string) {
    return this.palette.colors.findIndex(c => c.name === name);
  }

  /**
   * Get palette index of a color value.
   * @param value - The color value to look up
   * @returns index or -1 if not found
   */
  colorValueIndex(value: string) {
    return this.palette.colors.findIndex(c => c.value === value);
  }

  colorValue(color: string) {
    if (color === 'default') {
      return 'hsl(0, 0%, 50%)';
    }
    const c = this.palette.colors.find(entry => entry.name === color);
    if (!c) {
      throw new Error(`no color named '${color}'`);
    }
    return c.value;
  }

  colorValueAt(index: number) {
    const colors = this._colorMap
      ? this._colorMap.map(i => this.palette.colors[i])
      : this.palette.colors;
    if (index === -1) {
      // visit
      return colors.at(-1)!.value;
    } else if (index === -2) {
      // highlight
      return colors.at(-2)!.value;
    }
    // Never use 'visit' for any series/datapoint color
    return colors[index % (colors.length - 1)].value;
  }

  get numSeriesColors(): number {
    const colors = this._colorMap
      ? this._colorMap.map(i => this.palette.colors[i])
      : this.palette.colors;
    return colors.length - 1; // last entry is the "visit" color
  }

  /**
   * Returns CSS custom property key/value pairs for all series colors in the
   * current palette, plus precomputed lightened variants. Inject these onto the
   * SVG root element so that `.series-N` CSS rules resolve correctly without
   * any hardcoded per-palette CSS blocks.
   */
  // Returns CSS custom property declarations for the active palette, keyed as
  // --color-palette-series-N and --color-palette-series-N-light. These are injected
  // onto the SVG root element at render time so they cascade to all chart elements.
  // NOTE: for pattern palettes, these vars are injected but have no effect on the
  // pattern colors themselves — those are hardcoded as SVG presentation attributes
  // inside the <pattern> elements and cannot be driven by CSS vars. See the patterns
  // array comment in the palette definitions above for the full explanation.
  paletteVars(): { [key: string]: string } {
    const vars: { [key: string]: string } = {};
    const colors = this._colorMap
      ? this._colorMap.map(i => this.palette.colors[i])
      : this.palette.colors;
    const numSeries = colors.length - 1; // exclude "visit" slot
    for (let i = 0; i < numSeries; i++) {
      const value = colors[i].value;
      vars[`--color-palette-series-${i}`] = value;
      // Precompute lightened variant (used by scatter plot symbols).
      // Parses HSL numeric components; falls back to base color for non-HSL values.
      const nums = value.match(/\d+/g)?.map(Number);
      if (nums && nums.length >= 3) {
        const [h, s, l] = nums;
        const sLight = Math.max(0, s - Math.min(10, s));
        const lLight = Math.min(100, l + Math.min(25, 100 - l));
        vars[`--color-palette-series-${i}-light`] = `hsl(${h}, ${sLight}%, ${lLight}%)`;
      } else {
        vars[`--color-palette-series-${i}-light`] = value;
      }
    }
    return vars;
  }

  patternValueAt(index: number) {
    const patterns = this.palette.patterns;
    if (index === -1) {
      // highlight
      return patterns!.at(-1)!.value;
    }
    // Never use 'visit' for any series/datapoint color
    return patterns![index % (patterns!.length - 1)].value;
  }

  contrastValueAt(index: number) {
    const colors = this.palette.isPattern
      ? this.palette.patterns!
      : this._colorMap
        ? this._colorMap.map(i => this.palette.colors[i])
        : this.palette.colors;
    if (index === -1) {
      // highlight
      return colors.at(-1)!.contrastValue;
    }
    // Never use 'visit' for any series/datapoint color
    return colors[index % (colors.length - 1)].contrastValue ?? `hsl(0, 0%, 100%)`;
  }

  registerKey(key: string) {
    // TEMP: just a simple way to make sure each key has a unique color seed
    if (!this.keys.has(key)) {
      this.keys.set(key, {
        index: this.keys.size,
        base: null,
        light: null,
        dark: null
      });
    }
  }

  getPaletteList() {
    // this.paletteList = this.palettes.map()
  }

  // set_colors(color_obj: Colors) {
  //   if (!color_obj.palette) {
  //     // if no palette, use the default palette
  //     this.setPalette(0);
  //   } else {
  //     // if palette, append the default palette to the supplied palette, for more values
  //     this.palette = color_obj.palette.concat(this.palette);
  //   }
  //   this.primary = color_obj.primary;
  //   this.accent = color_obj.accent;
  //   this.active = color_obj.active;
  // }

  selectPaletteWithKey(key: string) {
    this._prevSelectedColor = this.paletteKey
    this._paraState.updateConfig(draft => {
      draft.color.colorPalette = key;
    });
  }

  /*get_palettes  ( palette_ids ) {
    if (!palette_ids) {
      return this.palettes;
    }

    if ( `string` === typeof palette_ids) {
      return this.palettes[palette_ids];
    }

    let palettes = [];
    for (let i = 0, i_len = palette_ids.length; i_len > i; ++i) {
      let palette = this.palettes[palette_ids[i]];
      if (!palette) {
        palette = this.palettes[`palette-${palette_ids[i]}`];
      }

      if (palette) {
        palettes.push(palette);
      }
    }
    return palettes;
  }*/

  /*set_palette_color_by_index  ( palette_id, index, color ) {
    let palette = this.palettes[palette_id];
    if (palette) {
      palette[index] = color;
    }
  }*/

  /*create_palette  ( id, colors, metadata ) {
    let palette = this.palettes[id];
    if (!palette) {
      this.palettes[id] = {};
      palette = this.palettes[id];
    }
    palette.name = metadata.name;
    palette.title = metadata.title;
    palette.type = metadata.type;
    palette.colors = colors;
  }*/

  getHslComponents(hsla: string) {
    let hsl_regex = /hsl[a]?\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/;
    let hsl_array = hsla.match(hsl_regex)!;
    let hsla_components = {
      hue: +hsl_array[1],
      h: +hsl_array[1],

      saturation: +hsl_array[2],
      s: +hsl_array[2],

      lightness: +hsl_array[3],
      l: +hsl_array[3],

      alpha: 1,
      a: 1
    };
    return hsla_components
  }

  lighten(hsl: string, shade_count: number) {
    let hsl_comp = this.getHslComponents(hsl);

    let h = hsl_comp.hue;
    let s = hsl_comp.saturation;
    let l = hsl_comp.lightness;

    const new_l = Math.min((l + (shade_count * 5)), 100);
    return `hsl(${h}, ${s}%, ${new_l}%)`;
  }

  generateSequentialPalette(hsl: string, count: number, is_lighter: boolean) { //, palette_id) {
    let hsl_comp = this.getHslComponents(hsl);

    let h = hsl_comp.hue;
    let s = hsl_comp.saturation;
    let l = hsl_comp.lightness;

    let s_range = s - 15;
    if (is_lighter) {
      s_range = 85 - s;
    }

    let s_interval = Math.round((s_range / count) / 5);

    let l_range = l - 15;
    if (is_lighter) {
      l_range = 85 - l;
    }

    let l_interval = Math.round(l_range / count);

    let palette = [];
    for (let i = 0, i_len = count; i_len > i; ++i) {
      palette.push(`hsl(${h}, ${s}%, ${l}%)`);
      if (is_lighter) {
        s += s_interval;
        l += l_interval;
      } else {
        s -= s_interval;
        l -= l_interval;
      }
    }

    /*if (palette_id) {
      this.create_palette( palette_id, palette,
        {
          name: palette_id,
          title: palette_id,
          type: `numeric`
        }
      );
    } else {*/
    return palette;
    //}
  }

  /*generate_interpolation_palette  ( hsl1, hsl2, count, palette_id ) {
    let hsl_comp1 = this.getHslComponents(hsl1);
    let h1 = hsl_comp1.hue;
    let s1 = hsl_comp1.saturation;
    let l1 = hsl_comp1.lightness;

    let hsl_comp2 = this.getHslComponents(hsl2);
    let h2 = hsl_comp2.hue;
    let s2 = hsl_comp2.saturation;
    let l2 = hsl_comp2.lightness;

    count -= 1;

    let h_range = h1 - h2;
    let h_interval = h_range/count;

    let s_range = s1 - s2;
    let s_interval = s_range/count;

    let l_range = l1 - l2;
    let l_interval = l_range/count;

    let palette = [];
    for (let i = 0, i_len = count; i_len > i; ++i) {
      palette.push(`hsl(${Math.round(h1)}, ${Math.round(s1)}%, ${Math.round(l1)}%)`);
      h1 -= h_interval;
      s1 -= s_interval;
      l1 -= l_interval;
    }
    palette.push(`hsl(${h2}, ${s2}%, ${l2}% )`);

    this.create_palette( palette_id, palette,
      {
        name: palette_id,
        title: palette_id,
        type: `numeric`
      }
    )
  }*/

  /*hsl_to_hex (h, s, l) {
    // function credit to https://stackoverflow.com/questions/7609130/set-the-value-of-an-input-field
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }*/

  //https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
  /*hex_to_hsl (hex, is_formatted) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    s = s*100;
    s = Math.round(s);
    l = l*100;
    l = Math.round(l);
    h = Math.round(360*h);

    let colorInHSL=[h,s,l];
    if (!is_formatted) {
      return colorInHSL;
    } else {
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }*/

}
