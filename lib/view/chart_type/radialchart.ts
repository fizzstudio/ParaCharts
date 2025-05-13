
import { DataLayer } from '../datalayer';
import { DatapointView, SeriesView } from '../data';
import {
  type RadiusSettings, type RadialSettings,
  type RadialChartType, type DeepReadonly
} from '../../store';
import { Label } from '../label';
import { type ParaView } from '../../paraview';
import { Sector } from '../shape/sector';

import { enumerate } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';

export type ArcType = 'circle' | 'semicircle';

export abstract class RadialChart extends DataLayer {

  declare protected _settings: DeepReadonly<RadialSettings>;
  
  protected _radius!: Required<RadiusSettings>;
  protected _cx!: number;
  protected _cy!: number;
  protected _arcType: ArcType = 'circle';
  // start slices at 12 o'clock
  protected _startAngleOffset = -0.25;
  // values 0 to 1
  protected _arc = 1;
  // TODO: calculate radius_divisor based on longest label, for pie and donut
  protected _radiusDivisor = 2.3;
  
  protected _labels: Label[] = [];
  //private centerLabel: Label;

  constructor(paraview: ParaView, index: number) {
    super(paraview, index);
  }

  protected _addedToParent() {
    super._addedToParent();
    //this.options = this.chart_obj.options[this.chart_type] || {};
    //if (!this.options.center_label) {
      // HACK: if center_label options not specified, add empty object to prevent errors on read
    //  this.options.center_label = {};
    //}
    //this.orientation = orientation;
    //this.title = title;
    //this.label = null;

    const radius: Partial<RadiusSettings> = this._settings.radius ?? {};
    radius.innerPercent ??= 0.6;

    this._cx = this._width/2;
    this._cy = this._height/2;

    if (this._arcType === 'semicircle') {
      this._arc = 0.5; // semicircle
      this._startAngleOffset = -0.25; // 9 o'clock
      // if y_offset not explicitly set in options, override default to set to vertical baseline, not vertically centered
//      this.center_label.y_offset = this.options.center_label.y_offset ? this.options.center_label.y_offset : 0; // vertical baseline
    }

    if (radius.outer === undefined) {
      let outerRadiusCalc = Math.min(this._height, this._width)/this._radiusDivisor;
      // for gauge charts that don't take up full height, move gauge down
      if (this._arc < 1) {
        outerRadiusCalc = Math.max(this._height, this._width)/this._radiusDivisor;
        radius.outer = outerRadiusCalc;
        this._cy = radius.outer;
      } else {
        radius.outer = outerRadiusCalc;
      }
    }
    if (radius.inner === undefined) {
      radius.inner = radius.outer*radius.innerPercent;
    }
    this._radius = radius as RadiusSettings;

    // for gauge charts that don't take up full height, move gauge down
    if (this._arc < 1) {
      this._cy = this._radius.outer;
    }
    
    // optional central label
    /*this.centerLabel = {
      label: null,
      label_pattern: this.options.center_label.label_pattern,
      is_render: this.options.center_label.is_render || false,
      value: null,
      value_index: this.options.center_label.value_index || 0,
      unit: null,
      subtext: this.options.center_label.subtext || null,
      class: null,
      x: 0,
      y: 0,
      y_offset: this.options.center_label.y_offset || 0.33,
      font_size_percent: this.options.center_label.font_size_percent || 0.8,
      unit_size_percent: this.options.center_label.unit_size_percent || 0.8
    };*/

    //this.label_font_size = chart_obj.options.axis.r.tick.font_size;
    //this.label_margin = chart_obj.options.axis.r.tick.margin;
  }

  get radius() {
    return this._radius;
  }

  get cx() {
    return this._cx;
  }

  get cy() {
    return this._cy;
  }

  get arcType() {
    return this._arcType;
  }

  get startAngleOffset() {
    return this._startAngleOffset;
  }

  protected _createComponents() {
    const xSeries = this.paraview.store.model!.allFacetValues('x')!.map(box =>
      box.value as string
    );
    const ySeries = this.paraview.store.model!.allFacetValues('y')!.map(box =>
      box.value as number);

    // const indep = this._model.indepVar;
    // const xs: string[] = [];
    // for (const [i, record] of this._model.data) {
    //   xs.push(this._model.format(
    //     xSeries.atBoxed(i), `${this.parent.docView.type as RadialChartType}Slice`));
    //   //const xId = utils.strToId(xs.at(-1)!);
    //   //todo().canvas.jimerator.addSelector(indep, i, `tick-x-${xId}`);
    // }

    const total = ySeries.reduce((a, b) => a + b, 0);
    const seriesView = new SeriesView(this, this.paraview.store.model!.keys[0], false);
    this._chartLandingView.append(seriesView);

    let accum = 0;
    for (const [x, i] of enumerate(xSeries)) {
      const currDatapoint = ySeries.at(i)!;

      /*if (this.center_label.is_render && this.center_label.value_index === j) {
        // set percentage as center label value
        // TODO: allow other values for center label
        this.center_label.value = Math.round(percentage * 100);
        this.center_label.unit = `%`;
        // this.center_label.subtext = independent_datapoint.value.format;
        this.center_label.class = `series_${j}`
      }*/
     
      // const text = this._model.format(
      //   xSeries.atBoxed(i), `${this.parent.docView.type as RadialChartType}Slice`);
      // modify percentage by arc degree, for circle fragments
      const percentage = this._arc*currDatapoint/total;
      const datapointView = this._createSlice(seriesView, {
        seriesIdx: i, 
        percentage,
        accum,
        numDatapoints: xSeries.length
      });
      seriesView.append(datapointView);
      accum += percentage;
      //todo().canvas.jimerator.addSelector(ySeries.name!, i, datapointView.id);
    }
    if (this._settings.label.isDrawEnabled) {
      this._createLabels();
    }
  }

  protected _createLabels() {
    const xSeries = this.paraview.store.model!.allFacetValues('x')!.map(box =>
      box.value as string
    );
    for (const [x, i] of enumerate(xSeries)) {
      const text = x;
      const slice = this._chartLandingView.children[0].children[i] as RadialSlice;
      const arcCenter = slice.sector.arcCenter;
      this.append(new Label(this.paraview, {
        text, 
        classList: ['radial_label'], 
        role: 'axislabel', 
        x: (slice.sector.x + arcCenter.x)/2,
        y: (slice.sector.y + arcCenter.y)/2,
        isPositionAtAnchor: true
      }));
    }
  }

  protected abstract _createSlice(seriesView: SeriesView, params: RadialDatapointParams): RadialSlice;

  legend() {
    const xSeries = this.paraview.store.model!.allFacetValues('x')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceLabel')));
    const ySeries = this.paraview.store.model!.allFacetValues('y')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceValue')));
    return xSeries.map((x, i) => ({
      label: `${x}: ${ySeries[i]}`,
      color: i
    }));
  }

  moveRight() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      if (leaf.next) {
        leaf.next.focus();
      } else {
        leaf.parent.children[0].focus();
      }
    } else {
      // Skip series view and go straight to the first datapoint
      this._chartLandingView.children[0].children[0].focus();
    }
  }

  moveLeft() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
      if (leaf.prev) {
        leaf.prev.focus();
      } else {
        leaf.parent.children.at(-1)!.focus();
      }
    } else {
      // Skip series view and go straight to the first datapoint
      this._chartLandingView.children[0].children[0].focus();
    }
  }

  moveUp() {
  }

  moveDown() {
  }

  playRight() {
    
  }

  playLeft() {
    
  }

  selectCurrent(extend: boolean) {
    
  }

  queryData() {
  }

}

export interface RadialDatapointParams {
  seriesIdx: number;
  percentage: number;
  accum: number;
  numDatapoints: number;
}

export abstract class RadialSlice extends DatapointView {

  declare readonly chart: RadialChart;

  protected _sector!: Sector;
  
  constructor(parent: SeriesView, protected _params: RadialDatapointParams) {
    super(parent);
    this._isStyleEnabled = true;
  }

  get class() {
    return `datapoint slice series-${this._params.seriesIdx}`;
  }

  get role() {
    return 'graphics-symbol';
  }

  get roleDescription() {
    return 'datapoint';
  }

  // get extraAttrs() {
  //   return [{attr: literal`aria-labelledby`, value: this._params.label.id}];
  // }

  get sector() {
    return this._sector;
  }

  protected _createSymbol() {
  }

}