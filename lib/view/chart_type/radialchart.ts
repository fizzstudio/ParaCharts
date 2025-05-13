
import { DataLayer } from '../datalayer';
import { ChartLandingView, DatapointView, SeriesView } from '../data';
import {
  type RadialSettings,
  type RadialChartType, type DeepReadonly
} from '../../store';
import { Label, type LabelTextAnchor } from '../label';
import { type ParaView } from '../../paraview';
import { Sector } from '../shape/sector';
import { Path } from '../shape/path';
import { enumerate } from '@fizz/paramodel';
import { formatBox } from '@fizz/parasummary';
import { Vec2 } from '../../common/vector';

export type ArcType = 'circle' | 'semicircle';

export abstract class RadialChart extends DataLayer {

  declare protected _settings: DeepReadonly<RadialSettings>;
  
  //protected _radius!: Required<RadiusSettings>;
  protected _cx!: number;
  protected _cy!: number;
  protected _arcType: ArcType = 'circle';
  // start slices at 12 o'clock
  protected _startAngleOffset = -0.25;
  // values 0 to 1
  protected _arc = 1;
  // TODO: calculate radius_divisor based on longest label, for pie and donut
  protected _radiusDivisor = 2.3;
  
  //protected _labels: Label[] = [];
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

    // const radius: Partial<RadiusSettings> = this._settings.radius ?? {};
    // radius.innerPercent ??= 0.6;

    this._cx = this._width/2;
    this._cy = this._height/2;

    if (this._arcType === 'semicircle') {
      this._arc = 0.5; // semicircle
      this._startAngleOffset = -0.25; // 9 o'clock
      // if y_offset not explicitly set in options, override default to set to vertical baseline, not vertically centered
//      this.center_label.y_offset = this.options.center_label.y_offset ? this.options.center_label.y_offset : 0; // vertical baseline
    }

    // if (radius.outer === undefined) {
    //   let outerRadiusCalc = Math.min(this._height, this._width)/this._radiusDivisor;
    //   // for gauge charts that don't take up full height, move gauge down
    //   if (this._arc < 1) {
    //     outerRadiusCalc = Math.max(this._height, this._width)/this._radiusDivisor;
    //     radius.outer = outerRadiusCalc;
    //     this._cy = radius.outer;
    //   } else {
    //     radius.outer = outerRadiusCalc;
    //   }
    // }
    // if (radius.inner === undefined) {
    //   radius.inner = radius.outer*radius.innerPercent;
    // }
    // this._radius = radius as RadiusSettings;

    // for gauge charts that don't take up full height, move gauge down
    // if (this._arc < 1) {
    //   this._cy = this._radius.outer;
    // }
    
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

  // get radius() {
  //   return this._radius;
  // }

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

  init() {
    super.init();
    if (this._settings.label.isDrawEnabled) {
      // this needs to happen after the datapoints have been created and laid out
      this._createLabels();
      const labels = this.datapointViews.map(dp => (dp as RadialSlice).label!);
      const minX = Math.min(...labels.map(label => label.left));
      const maxX = Math.max(...labels.map(label => label.right));
      this._width = maxX - minX;
      this._parent.width = this._width;
      if (minX < 0) {
        this.datapointViews.forEach(dp => {
          dp.x += -minX; 
        });
        this._cx += -minX;
      }
    }
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
  }

  protected _createLabels() {
    const xSeries = this.paraview.store.model!.allFacetValues('x')!.map(box =>
      box.value as string
    );
    for (const [x, i] of enumerate(xSeries)) {
      const text = x;
      const slice = this._chartLandingView.children[0].children[i] as RadialSlice;
      const arcCenter = slice.shape.arcCenter;
      const gapVec = slice.shape.orientationVector.multiplyScalar(10);
      let labelLoc: Vec2;
      let anchor: LabelTextAnchor;
      if (this._settings.sliceLabelPosition === 'inside') {
        labelLoc = slice.shape.loc.add(arcCenter).divideScalar(2);
        anchor = 'middle';
      } else if (this._settings.sliceLabelPosition === 'outside') {
        labelLoc = arcCenter.add(gapVec);
        anchor = labelLoc.x > this.cx ? 'start' : 'end';
      } else {
        labelLoc = new Vec2();
        anchor = 'middle';
      }
      slice.label = new Label(this.paraview, {
        text, 
        classList: ['radial_label'], 
        role: 'axislabel', 
        x: labelLoc.x,
        y: labelLoc.y,
        textAnchor: anchor,
        isPositionAtAnchor: true
      });
      slice.leader = new Path(this.paraview, {
        points: [arcCenter, labelLoc, labelLoc.x > slice.label.centerX
          ? labelLoc.subtractX(slice.label.width)
          : labelLoc.addX(slice.label.width)],
        stroke: this.paraview.store.colors.colorValueAt(slice.color),
        strokeWidth: 2
      });
      // Labels draw as children of the slice so the highlights layer can `use` them
      slice.append(slice.leader);
      slice.append(slice.label);
    }
    this._resolveLabelCollisions();
  }

  protected _resolveLabelCollisions() {
    const slices = [...this.datapointViews] as RadialSlice[];
    // Sort slices according to label height onscreen from lowest to highest
    slices.sort((a, b) => b.label!.y - a.label!.y);

    // const leaderLabelOffset = this.paraview.store.settings.chart.isDrawSymbols 
    //   ? -this._chart.settings.seriesLabelPadding 
    //   : 0;

    slices.slice(1).forEach((s, i) => {
      // Move each label up out of collision with the one onscreen below it.
      if (s.label!.intersects(slices[i].label!)) {
        s.label!.y = slices[i].label!.y - s.label!.height;
        s.leader!.points = [s.leader!.points[0], s.label!.loc, s.leader!.points[2].setY(s.label!.y)];
      }
    });

    // colliders.forEach(c => {
    //   // NB: this value already includes the series label padding
    //   c.label.x += (this._chart.settings.leaderLineLength + leaderLabelOffset); 
    //   this.leaders.push(new LineLabelLeader(c.endpoint, c.label, this._chart));
    //   this.prepend(this.leaders.at(-1)!);
    // });
  }

  protected abstract _createSlice(seriesView: SeriesView, params: RadialDatapointParams): RadialSlice;

  legend() {
    const xSeries = this.paraview.store.model!.allFacetValues('x')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceLabel')));
    const ySeries = this.paraview.store.model!.allFacetValues('y')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceValue')));
    return xSeries.map((x, i) => ({
      label: `${x}: ${ySeries[i]}`,
      color: i,
      datapointIndex: i
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
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof DatapointView) {
        // Keep the series view focused on the datapoint, but make
        // the chart landing the new leaf
        leaf.parent.blur();
    }
  }

  moveDown() {
    const leaf = this._chartLandingView.focusLeaf;
    if (leaf instanceof ChartLandingView) {
      if (leaf.children[0].currFocus) {
        // Restore focus to the last-focused datapoint
        leaf.children[0].focus();
      } else {
        // Focus on the first datapoint
        this._chartLandingView.children[0].children[0].focus();
      }
    }
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

  protected _label: Label | null = null;
  protected _leader: Path | null = null;
  
  constructor(parent: SeriesView, protected _params: RadialDatapointParams) {
    super(parent);
    this._isStyleEnabled = true;
  }

  get label() {
    return this._label;
  }

  set label(label: Label | null) {
    this._label = label;
  }

  get leader() {
    return this._leader;
  }

  set leader(leader: Path | null) {
    this._leader = leader;
  }

  get shape() {
    return this._shape as Sector;
  }

  get role() {
    return 'graphics-symbol';
  }

  get roleDescription() {
    return 'datapoint';
  }

  get styleInfo() {
    const style = super.styleInfo;
    delete style.strokeWidth;
    delete style.stroke;
    return style;
  }

  get x() {
    return super.x;
  }

  set x(x: number) {
    if (this._label) {
      this._label.x += x - this._x;
    }
    if (this._leader) {
      this._leader.x += x - this._x;
    }
    super.x = x;
  }

  get y() {
    return super.y;
  }

  set y(y: number) {
    if (this._label) {
      this._label.y += y - this._y;
    }
    if (this._leader) {
      this._leader.y += y - this._y;
    }
    super.y = y;
  }

  protected _createSymbol() {
  }

}