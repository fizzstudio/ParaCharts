
import { DataBinner, BinsToBraille} from '.';

import { LitElement, html, css, nothing, render, type PropertyValues, PropertyValueMap } from 'lit';
import { property, state, queryAssignedNodes, customElement } from 'lit/decorators.js';
import {type Ref, ref, createRef} from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ProportionalDataBinner } from './propBinner';
import { ParaComponent } from '../paracomponent';

const brailleUnicodeBlock = 0x2800;

/**
 * Converts an array of dot specifications to a string of (Unicode) braille.
 * Each dot specification is an array of integers (1-8); [] represents a braille space character.
 */
function convertCells(cells: readonly (readonly number[])[]): string {
  return cells.reduce((accumulator, cell) => {
    if (typeof(cell) === 'undefined' || cell === null)
      throw new Error("Invalid dot specification");
    let dots = brailleUnicodeBlock;
    for (const dot of cell) {
      if (dot < 1 || dot > 8)
        throw new Error(`Dot out of range: ${dot}`);
      dots |= 1 << (dot - 1);
    }
    return accumulator + String.fromCharCode(dots);
  }, '');
}

/**
 * SparkBraille display web component.
 * Typically, you pass your data values to the `data` attribute.
 * Data can also be placed inside the web component tag itself,
 * but this is slightly less efficient, causing an extra update.
 * @public
 */
@customElement('fizz-sparkbraille')
export class SparkBraille extends ParaComponent {
  static shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    // This is necessary to set focus on regionRef when the custom element
    // gets focused.
    delegatesFocus: true
  };
  /** Data values in the form of a space-separated string. */
  @property() data?: string;
  /** Whether to fill in extra dots like a bar chart. */
  @property({type: Boolean}) bar = false;
  /** Data values in the form of a string label and a numeric value. Stringified for convenience.*/
  @property() labeledData?: string;
  /** Use with labeled data to produce a proportional chart. */
  @property({ type: Boolean }) isProp = false;
  @property() currentSeries = '';

  @state() private cells?: readonly (readonly number[])[];

  @queryAssignedNodes() private slotNodes!: Node[];

  private _regionRef: Ref<HTMLDivElement> = createRef();
  private _preRef: Ref<HTMLPreElement> = createRef();
  private onSelectionChange: () => void;
  private _binnedData!: readonly number[];

  static styles = css`
    div {
      font-size: var(--font-size, 2rem);
      padding: var(--padding, unset);
      margin: var(--margin, unset);
    }
    pre {
      margin: 0;
    }
  `;

  /** Binned data, in case you want to see it. */
  get binnedData(): readonly number[] {
    return this._binnedData;
  }

  constructor() {
    super();
    this.onSelectionChange = () => {
      const selection = document.getSelection();
      // Only respond to events from the current interactive region.
      if (selection?.anchorNode?.parentNode?.parentNode !== this._regionRef.value) {
        return;
      }
      const offset = selection?.anchorOffset;
      this.dispatchEvent(
        new CustomEvent(
          'select',
          {
            bubbles: true,
            composed: true,
            detail: offset
          }
        )
      );
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('selectionchange', this.onSelectionChange);
    if (this.data && !this.cells) {
      this.renderBraille(this.data);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  protected willUpdate(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    if (changedProperties.has('data')) {
      this.renderBraille(this.data!);
    }
  }

  toBraille(string: string) {
    return string.split("").map(c => brailleMap[c as keyof typeof brailleMap]).join("");
  }

  render() {
    let brailleContent;
    if (this.isProp) {
    //const propData = [{ label: "Acme", value: 10 }, { label: "Blobbo", value: 50 }, { label: "CornCo", value: 35 }, { label: "Broadbean", value: 4 }, { label: "Billybob's", value: 1 }]
    const propData = this.labeledData
    const propBinner = new ProportionalDataBinner(propData!, 20)
    brailleContent = this.toBraille(propBinner.returnString)
  }
  else{
    brailleContent = this.cells ? convertCells(this.cells) : ''
  }
    /*@click=${(e: MouseEvent) => {
      const xDist = e.x - this.preRef.value!.offsetLeft;
      const xPct = xDist/this.preRef.value!.offsetWidth;
      // In practice, it seems xPct will never be 1, so it shouldn't be
      // necessary to clamp cellPos to braille.length - 1
      const cellPos = xPct*this.braille.length;
      const cell = Math.floor(cellPos);
      const pos = cellPos - cell;
      this.dispatchEvent(
        new CustomEvent(
          'dotclick',
          {
            bubbles: true,
            composed: true,
            detail: cell*2 + Math.round(pos)
          }
        )
      );
    }}*/
    const series = this._paraState.model?.series.find((s) => s.key === this.currentSeries);
    return html`
      <div
        ${ref(this._regionRef)}
        role="textbox"
        contenteditable="true"
        @keydown=${(e: KeyboardEvent) => {
          // Prevent the user from entering text when initially focused on the div
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
          }
        }}
      >
        <pre
          ${ref(this._preRef)}
          contenteditable="false"
        >${
          brailleContent + ' ' +  (series ? this.toBraille(series.label) : '')
        }</pre>
        <div class="data" style="display: none">
          <slot
          ></slot>
        </div>
      </div>
    `;
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    if (this.cells) {
      return;
    }
    const dataNode = this.slotNodes.find(node => node.textContent?.trim());
    if (dataNode) {
      this.renderBraille(dataNode.textContent!);
    }
  }

  private renderBraille(dataText: string) {
    const data = dataText.split(/ /).map(parseFloat);
    const binner = new DataBinner(data, 4);
    this._binnedData = binner.binnedData;
    const brailleLine = new BinsToBraille(this._binnedData, this.bar);
    this.cells = brailleLine.cells;
  }

}

//NB: Sam generated this map with AI because he was on a deadline. Ideally test this for accuracy before production
const brailleMap = {
  ' ': '⠀',
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
  ',': '⠂', '.': '⠲', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦',
  '"': '⠶', '\'': '⠄', '-': '⠤', '(': '⠐', ')': '⠐',
  'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋', 'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚',
  'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏', 'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞',
  'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭', 'Y': '⠽', 'Z': '⠵'
};

declare global {

  interface HTMLElementTagNameMap {
    'fizz-sparkbraille': SparkBraille
  }

}