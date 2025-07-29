/* ParaCharts: Storybook Config
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

import type { Preview } from "@storybook/web-components-vite";
import { within as withinShadow } from 'shadow-dom-testing-library';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Chart', 
          'CSUN', 
          'AI-enhanced Charts', [
            'Pastry Charts', 
            'Bar Charts', [
              'Single Bar Charts',
              'Multi Bar Charts',
              'Single Column Charts',
              'Multi Column Charts',
              'Single Lollipop Charts',
              'Multi Lollipop Charts',
            ],
            'Line Charts',[
              'Single Line Charts',
              'Multi Line Charts',
              'Single Stepline Charts',
              'Multi Stepline Charts'
            ],
            'Scatter Charts',
            'Histograms',
            'Heat Maps'
          ], 'Basic Charts', [
            'Pastry Charts', 
            'Bar Charts', [
              'Single Bar Charts',
              'Multi Bar Charts',
              'Single Column Charts',
              'Multi Column Charts',
              'Single Lollipop Charts',
              'Multi Lollipop Charts',
            ],
            'Line Charts',[
              'Single Line Charts',
              'Multi Line Charts',
              'Single Stepline Charts',
              'Multi Stepline Charts'
            ],
            'Scatter Charts',
            'Histograms',
            'Heat Maps'
          ]
        ],
        method: 'alphabetical'
      },
    },
  },
  beforeEach({ canvasElement, canvas }) {
    Object.assign(canvas, { ...withinShadow(canvasElement) });
  },
};

export type ShadowQueries = ReturnType<typeof withinShadow>;

declare module 'storybook/internal/csf' {
  interface Canvas extends ShadowQueries {}
}

export default preview;
