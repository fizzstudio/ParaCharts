
import { ParaComponent } from '../components';
import { Logger, getLogger } from '../common/logger';
import { PlaneDatapoint, type Model } from '@fizz/paramodel';
import { formatXYDatapointX, formatXYDatapointY } from '@fizz/parasummary';

import { html, css, nothing, render, type PropertyValues } from 'lit';
import { property, state, queryAssignedElements, customElement } from 'lit/decorators.js';
import {type Ref, ref, createRef} from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';


/**
 * Data table view.
 * @internal
 */
@customElement('para-datatable')
export class DataTableView extends ParaComponent {
  private log: Logger = getLogger("DataTableView");
  model!: Model;

  static styles = [
    css`
      th, td {
        padding: 0.25rem;
      }
      thead {
        position: sticky;
        top: 0;
        background: var(--theme-color-light);
      }
      .wrapper {
        overflow: scroll;
        max-height: 15rem;
      }
    `
  ];

  protected render() {
    this.log.info('MODEL', this.model);
    return html`
      <div class="wrapper">
        <table>
          <thead>
            <tr>
              <th>
                ${this.model.getFacet(this.model.independentFacetKeys[0])!.label} <!-- TODO: Assumes exactly 1 indep facet -->
              </th>
              ${this.model.series.map(s => html`
                <th scope="col">
                  ${s.key}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${this.model.series[0].datapoints.map((dp, i) => html`
              <tr>
                <td>
                  ${formatXYDatapointX(dp as PlaneDatapoint, 'raw')}
                </td>
                ${this.model.series.map(s => html`
                  <td>
                    ${formatXYDatapointY(s[i] as PlaneDatapoint, 'value')}
                  </td>
                `)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

}

declare global {

  interface HTMLElementTagNameMap {
    'para-datatable': DataTableView;
  }

}