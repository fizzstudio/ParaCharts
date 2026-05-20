import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type ButtonDescriptor } from '@fizz/ui-components';

export interface CardDescriptor extends ButtonDescriptor {
  /** CSS color values — renders a swatch strip when present. */
  swatches?: string[];
}

@customElement('para-card-selector')
export class CardSelector extends LitElement {

  @property({ attribute: false }) buttons: { [key: string]: CardDescriptor } = {};
  @property() selected: string = '';
  @property({ type: Boolean }) wrap = false;

  static styles = css`
    :host {
      display: block;
    }

    fieldset {
      border: none;
      padding: 0;
      margin: 0;
    }

    legend {
      font-size: 0.8em;
      font-weight: bold;
      margin-bottom: 0.3rem;
    }

    .card-group {
      display: flex;
      gap: 0.3rem;
    }

    /* 5-column grid for 2 rows of palette cards */
    .card-group.wrap {
      display: grid;
      grid-template-columns: repeat(5, auto);
      gap: 0.3rem;
    }

    label {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--para-border-color, #aaa);
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      background: transparent;
      box-sizing: border-box;
      transition: transform 300ms ease;
    }

    /* Icon mode: vertical, image on top, label below */
    label.has-icon {
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.3rem 0.4rem;
      min-width: 3rem;
      height: 3.5rem;
    }

    label.has-icon img {
      flex: 1;
      width: 2rem;
      height: auto;
      object-fit: contain;
    }

    /* Swatch mode: vertical, label top, color bars below */
    label.has-swatches {
      flex-direction: column;
      align-items: stretch;
      gap: 0.2rem;
      padding: 0.3rem 0.3rem 0.25rem;
      width: 4rem;
    }

    label.has-swatches .card-label {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }

    label.has-swatches .swatches {
      display: flex;
      gap: 2px;
      width: 100%;
    }

    label.has-swatches .swatch {
      flex: 1;
      aspect-ratio: 1;
      height: auto;
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      forced-color-adjust: none;
    }

    /* Label-only: compact chip */
    label.label-only {
      flex-direction: row;
      padding: 0.2rem 0.6rem;
      height: 1.8rem;
      white-space: nowrap;
    }

    .swatches {
      display: flex;
      gap: 2px;
      flex-shrink: 0;
    }

    .swatch {
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      forced-color-adjust: none;
    }

    .card-label {
      font-size: 0.72em;
      text-align: center;
    }

    label.selected {
      background-color: var(--theme-color-light, hsl(210.5, 100%, 88%));
      border-color: var(--theme-color-light, hsl(210.5, 100%, 75%));
      font-weight: 700;
      transform: scale(1.05);
      z-index: 1;
    }

    label:has(input:focus-visible) {
      outline: 2px solid Highlight;
      outline-offset: 1px;
    }

    /* Visually hidden but focusable radio input */
    input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  private _select(key: string) {
    this.dispatchEvent(
      new CustomEvent('select', { detail: key, bubbles: true, composed: true })
    );
  }

  render() {
    const entries = Object.entries(this.buttons);
    return html`
      <fieldset>
        <legend><slot name="legend"></slot></legend>
        <div class="card-group ${this.wrap ? 'wrap' : ''}">
          ${entries.map(([key, desc]) => {
            const isSelected = key === this.selected;
            const hasIcon = !!desc.icon;
            const hasSwatches = !!desc.swatches?.length;
            const modeClass = hasIcon ? 'has-icon' : hasSwatches ? 'has-swatches' : 'label-only';
            return html`
              <label
                class="${modeClass}${isSelected ? ' selected' : ''}"
                title=${desc.title ?? desc.label}
              >
                <input
                  type="radio"
                  name="card-selector"
                  .value=${key}
                  ?checked=${isSelected}
                  @change=${() => this._select(key)}
                >
                ${hasIcon ? html`<img src=${desc.icon!} alt="">` : nothing}
                ${hasSwatches ? html`
                  <span class="swatches">
                    ${desc.swatches!.map(color => html`
                      <span class="swatch" style="background:${color}"></span>
                    `)}
                  </span>
                ` : nothing}
                <span class="card-label">${desc.label}</span>
              </label>
            `;
          })}
        </div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'para-card-selector': CardSelector;
  }
}
