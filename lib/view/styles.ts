/* ParaCharts: CSS Styles
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

import { css } from 'lit';

export const styles = css`
  :host,
  :root {
    --axis-line-color: hsl(0, 0%, 0%);
    --label-color: hsl(0, 0%, 0%);
    --tick-grid-color: hsl(270, 50%, 50%);
    --background-color: white;
    --theme-color: var(--fizz-theme-color, purple);
    --theme-color-light: var(--fizz-theme-color-light, hsl(275.4, 100%, 88%));
    --theme-contrast-color: white;
    --fizz-theme-color: var(--paracharts-theme-color, hsla(209, 100%, 27%, 1.00));
    --fizz-theme-color-light: var(--paracharts-theme-color-light, hsl(210.5, 100%, 88%));
    /*--visited-color: red;*/
    --selected-color: var(--label-color);
    --datapoint-centroid: 50% 50%;
    --focus-animation: all 0.5s ease-in-out;
    --chart-cursor: pointer;
    --data-cursor: cell;

    --font-fam: "Trebuchet MS", Helvetica, sans-serif;

    /* panel styles */
    --panel-text-color: hsla(0, 0%, 5%, 1.00);
    --panel-text-size: 1em;

    /* default color palette */
    --color-palette-series-0: hsl(225, 30%, 52%);
    --color-palette-series-1: hsl(12, 69%, 35%);
    --color-palette-series-2: hsl(75, 43%, 45%);
    --color-palette-series-3: hsl(40, 100%, 49%);
    --color-palette-series-4: hsl(215, 37%, 66%);
    --color-palette-series-5: hsl(63, 100%, 23%);
    --color-palette-series-6: hsl(34, 57%, 46%);
    --color-palette-series-7: hsl(51, 56%, 64%);
    --color-palette-series-8: hsl(253, 26%, 43%);
    --color-palette-series-9: hsl(85, 65%, 36%);

    --focus-shadow-color: gray;
    --focus-shadow: drop-shadow(0px 0px 4px var(--focus-shadow-color));
  }

  .hidden { display: none !important; }

  /* https://kittygiraudel.com/snippets/sr-only-class/ */
  .sr-only {
    border: 0 !important;
    clip: rect(1px, 1px, 1px, 1px) !important;
    -webkit-clip-path: inset(50%) !important;
    clip-path: inset(50%) !important;
    height: 1px !important;
    overflow: hidden !important;
    margin: -1px !important;
    padding: 0 !important;
    position: absolute !important;
    width: 1px !important;
    white-space: nowrap !important;
  }

  para-control-panel {
    color: var( --panel-text-color);
    font-size: var( --panel-text-size);
  }

  * {
    font-family: var(--font-fam);
  }
  #y-axis-line {
    fill: none;
    stroke: var(--axis-line-color);
    stroke-width: 2px;
    stroke-linecap: round;
  }
  #x-axis-line {
    fill: none;
    stroke: var(--axis-line-color);
    opacity: 1;
    stroke-width: 2px;
    stroke-linecap: round;
  }
  .chart-title {
    font-size: 1.25rem;
  }
  /*.chart-title .middle {
    text-anchor: middle;
  }
  .chart-title .end {
    text-anchor: end;
  }*/
  .label {
    display: block;
    fill: var(--label-color);
  }
  .axis-title {
    text-anchor: middle;
  }
  .tick-label {
    fill: var(--label-color);
  }
  /*.tick-label.horiz {
    text-anchor: middle;
  }
  .tick-label.horiz.rotated {
    text-anchor: end;
  }
  .tick-label.horiz.rotated.north {
    text-anchor: start;
  }
  .tick-label.vert {
    text-anchor: end;
  }
  .tick-label.vert.east {
    text-anchor: start;
  }*/
  .tickmark-y {
    opacity: 0.2;
  }
  .tickmark-y-0 {
    fill: var(--tick-grid-color);
    stroke: var(--tick-grid-color);
    opacity: 1;
    stroke-width: 2px;
    stroke-linecap: round;
  }
  .tick-group-y:hover, .tick-group-y:hover .tickmark-y {
    font-weight: bold;
    opacity: 1;
  }
  .tickmark-x {
    opacity: 0.2;
  }
  .tickmark-x-0 {
    fill: var(--tick-grid-color);
    stroke: var(--tick-grid-color);
    opacity: 1;
    stroke-width: 2px;
    stroke-linecap: round;
  }
  .tick-group-x:hover, .tick-group-x:hover .tickmark_x {
    font-weight: bold;
    opacity: 1;
  }
  rect#data-backdrop {
    stroke: none;
    fill: none;
    pointer-events: all;
  }
  .stack {
    stroke-width: 0;
  }
  .bar:hover, .bar:focus {
    fill: hsl(270, 50%, 65%);
    outline: 2px auto -webkit-focus-ring-color;
  }
  .datapoint_background {
    fill: none;
    stroke: none;
    pointer-events: all;
    outline: none;
  }
  .datapoint_background:hover,
  .datapoint_background:focus {
    outline: 2px auto -webkit-focus-ring-color;
    box-shadow: none;
  }
  .data-line {
    fill: none;
    /*stroke-width: 3px;*/
    stroke-linecap: round;
  }
  .data_area {
    stroke: hsl(270, 50%, 50%);
    stroke-width: 3px;
    stroke-linecap: round;
    fill: none;
  }
  .data_area_background {
    stroke: none;
    fill: hsl(270, 50%, 50%);
    fill-opacity: 0.8;
  }
  .trendline {
    stroke: red;
    stroke-width: 3px;
    fill: none;
  }
  .center_label > tspan.subtext {
    font-size: 2rem;
    text-anchor: middle;
  }
  /*g.datapoint {
    transform-origin: var(--datapoint-centroid);
  }*/
  g.datapoint g.datapoint_popup rect {
    fill: hsl(0, 0%, 25%);
  }
  g.datapoint g.datapoint_popup text {
    fill: white;
    font-size: 1rem;
    text-anchor: middle;
  }
  g.datapoint g.datapoint_popup {
    stroke: none;
    opacity: 0.0;
    transition: opacity 0.3s ease-in-out;
  }
  g.datapoint:focus g.datapoint_popup, g.datapoint:hover g.datapoint_popup {
    opacity: 1.0;
    transition: opacity 0.3s ease-in-out;
  }
  g.datapoint g.datapoint_popup .desc {
    opacity: 0.0;
  }
  g.datapoint:focus g.datapoint_popup .desc, g.datapoint:hover g.datapoint_popup .desc {
    opacity: 1.0;
    transition: opacity 0.3s ease-in-out 2s;
  }
  g.datapoint.visited {
    fill: var(--visited-color, red);
    stroke: var(--visited-color, red);
    transform-box: fill-box;
/*    transition: var(--focus-animation); */
  }
  g.datapoint.visited:focus {
    /*outline: none;
    box-shadow: none;*/
    transition: var(--focus-animation);
    filter: var(--focus-shadow);
    /*animation: pulse-animation 2s infinite;*/
  }

  [data-charttype="stepline"] g.datapoint.visited {
    fill: var(--visited-color, red);
    stroke: var(--visited-color, red);
    transform: none;
/*    transition: var(--focus-animation); */
  }

  /* use#visited-mark {
    fill: inherit;
    stroke: inherit;
    transition: inherit;
  } */
  use.visited-mark {
    pointer-events: none;
  }
  @keyframes pulse-animation {
    0% {
      filter: drop-shadow(0px 0px 0px gray);
    }
    100% {
      filter: drop-shadow(0px 0px 12px gray);
    }
  }
  /*[data-charttype="line"] g.datapoint.visited {
    transform: scale(1.5);
  }
  [data-charttype="bar"] g.datapoint.visited {
    transform: scaleX(1.15);
  }*/
  .selected-datapoint-marker {
    fill: transparent;
    stroke: var(--selected-color);
    stroke-width: 3px;
    /*opacity: 0.5;*/
    pointer-events: none;
    stroke-linejoin: round;
  }
  .symbol {
    /*stroke-width: 2;*/
    stroke-linejoin: round;
  }
  .slice path {
    stroke: none;
    /*opacity: 0.5;*/
  }
  .slice text {
    fill: black;
    stroke: black;
    text-anchor: middle;
  }

  :fullscreen,
  ::backdrop {
    background-color: var(--background-color);
  }

  /* COLOR PALETTES
   * --color-palette-series-N and --color-palette-series-N-light vars are
   * injected dynamically onto the SVG root element by Colors.paletteVars()
   * whenever the palette changes. This supports built-in and author-defined
   * palettes equally — no per-palette CSS blocks needed here.
   *
   * Each .series-N rule also defines --series-color-light so that child
   * elements (e.g. .symbol.lighten) can reference the lightened variant
   * via a single inherited custom property.
   */

  .series-0 {
    fill: var(--color-palette-series-0);
    stroke: var(--color-palette-series-0);
    --series-color-light: var(--color-palette-series-0-light);
  }
  .series-1 {
    fill: var(--color-palette-series-1);
    stroke: var(--color-palette-series-1);
    --series-color-light: var(--color-palette-series-1-light);
  }
  .series-2 {
    fill: var(--color-palette-series-2);
    stroke: var(--color-palette-series-2);
    --series-color-light: var(--color-palette-series-2-light);
  }
  .series-3 {
    fill: var(--color-palette-series-3);
    stroke: var(--color-palette-series-3);
    --series-color-light: var(--color-palette-series-3-light);
  }
  .series-4 {
    fill: var(--color-palette-series-4);
    stroke: var(--color-palette-series-4);
    --series-color-light: var(--color-palette-series-4-light);
  }
  .series-5 {
    fill: var(--color-palette-series-5);
    stroke: var(--color-palette-series-5);
    --series-color-light: var(--color-palette-series-5-light);
  }
  .series-6 {
    fill: var(--color-palette-series-6);
    stroke: var(--color-palette-series-6);
    --series-color-light: var(--color-palette-series-6-light);
  }
  .series-7 {
    fill: var(--color-palette-series-7);
    stroke: var(--color-palette-series-7);
    --series-color-light: var(--color-palette-series-7-light);
  }
  .series-8 {
    fill: var(--color-palette-series-8);
    stroke: var(--color-palette-series-8);
    --series-color-light: var(--color-palette-series-8-light);
  }
  .series-9 {
    fill: var(--color-palette-series-9);
    stroke: var(--color-palette-series-9);
    --series-color-light: var(--color-palette-series-9-light);
  }

  /* Symbol fill overrides — must appear after .series-N rules so that
   * outline/empty/lighten beats the inherited series fill. */
  .symbol.outline {
    fill: white;
  }
  .symbol.empty {
    fill: none;
  }
  .symbol.lighten {
    fill: var(--series-color-light);
  }

  /* Cluster centroid marker: fill from .series-N, stroke forced black. */
  .cluster-centroid {
    stroke: black;
  }

  .range-highlights {
    fill: pink;
    stroke: pink;
    fill-opacity: 0.25;
    stroke-width: 4px;
    stroke-opacity: 0.5;
  }
  .range-highlights rect[data-id="0"] {
    fill: orange;
    stroke: orange;
  }
  .range-highlights rect[data-id="1"] {
    fill: cyan;
    stroke: cyan;
  }
  .linebreaker[data-state=active] .linebreaker-marker {
    stroke: dodgerblue;
    stroke-width: 3px;
  }
  .best_fit_line[data-state=active] {
    display: inline;
    fill: none;
    stroke: hsl(315, 89%, 46%);
    stroke-width: 8px;
    stroke-linecap: butt;
    stroke-dasharray: 12 12;
    stroke-opacity: 0.5;
  }
  .best_fit_line[data-state=inactive] {
    display: none;
  }

  .setting-views {
    display: flex;
    gap: 1rem;
  }

  .setting-views+.setting-views {
    margin-top: 0.5rem;
  }

  figure {
    display: inline-block;
  }

  svg {
    display: block;
  }


  /* details box styles*/

  .tab-content {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.2rem;
  }

  .tab-content.stacked {
    flex-direction: column;
    gap: 0.1rem;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.5rem 0.2rem;
  }

  #chart-colors-presets {
    border: none;
    padding: 0;
    margin: 0;
  }

  #chart-colors-presets label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  #chart-colors-presets label span {
    text-align: center;
    word-spacing: 20em;
  }

  /* dialog styles */

  #output_dialog {
    margin: 0 auto;
  }

  #output-dialog::backdrop {
    background: repeating-linear-gradient(
      45deg,
      rgba(128,0,128, 0.2),
      rgba(128,0,128, 0.2) 1px,
      rgba(128,0,128, 0.3) 1px,
      rgba(128,0,128, 0.3) 20px
    );
  }

  #output-dialog button {
    color: white;
    background-color: var(--theme-color);
    border: 1px solid var(--theme-color);
  }

  #output-dialog h1 {
    color: black;
    font-size: 1.3rem;
    font-weight: normal;
  }

  /* Tab Page styles */

  button {
    margin: 0.2rem;
    background-color: var(--theme-color);
    color: var(--theme-contrast-color);
    border: thin solid var(--theme-color);
    border-radius: 0.2em;
    padding: 0.2em;
  }

  #status_split {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  [role="graphics-document"] {
    cursor: var(--chart-cursor);
  }

  #chart-layers {
    cursor: var(--data-cursor);
  }

  /* -------------------------------------------------------------------------
   * forced-colors: active
   * When the OS/browser constrains colour rendering, defer structural elements
   * to system colour keywords so text and structure remain legible.
   * Series fill/stroke use forced-color-adjust: none ONLY because ParaCharts
   * already provides shape and pattern redundancy for non-colour differentiation
   * (see lib/common/colors.ts pattern palette and 16 symbol types).
   * ------------------------------------------------------------------------- */
  @media (forced-colors: active) {
    :host { background-color: Canvas; }

    #y-axis-line,
    #x-axis-line     { stroke: CanvasText; }

    .chart-title,
    .axis-title       { fill: CanvasText; }

    .axis-label,
    .tick-label       { fill: CanvasText; }

    .tick-grid        { stroke: CanvasText; opacity: 0.25; }

    .focus-ring       { stroke: Highlight; }

    .visited          { fill: GrayText; stroke: GrayText; }

    /* Preserve author series colours: shape + pattern redundancy is already in
       place, so meaning does not depend on colour alone. */
    .series-0, .series-1, .series-2, .series-3,
    .series-4, .series-5, .series-6, .series-7,
    .series-8, .series-9 { forced-color-adjust: none; }
  }

  /* -------------------------------------------------------------------------
   * inverted-colors: inverted
   * Strengthen structural differentiation; avoid hue-semantic reliance.
   * ParaCharts' existing shape/pattern redundancy is the primary safeguard.
   * ------------------------------------------------------------------------- */
  @media (inverted-colors: inverted) {
    .focus-ring { stroke-width: 3px; }
  }
`;
