
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
import { ClassInfo } from 'lit/directives/class-map.js';
import { interpolate } from '@fizz/templum';
import { queryMessages, describeSelections, getDatapointMinMax } from '../../store/query_utils';

export type ArcType = 'circle' | 'semicircle';

export abstract class RadialChart extends DataLayer {
  
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

  get settings() {
    return super.settings as DeepReadonly<RadialSettings>;
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

  init() {
    super.init();
    if (this.settings.categoryLabel.isDrawEnabled) {
      // this needs to happen after the datapoints have been created and laid out
      this._createLabels();
      this._resizeToFitLabels();
      // const labels = this.datapointViews.map(dp => (dp as RadialSlice).categoryLabel!);
      // const minX = Math.min(...labels.map(label => label.left));
      // const maxX = Math.max(...labels.map(label => label.right));
      // this._width = maxX - minX;
      // this._parent.width = this._width;
      // if (minX < 0) {
      //   this.datapointViews.forEach(dp => {
      //     dp.x += -minX; 
      //   });
      //   this._cx += -minX;
      // }
    }
  }

  protected _resizeToFitLabels() {
    const labels = this.datapointViews.map(dp => (dp as RadialSlice).categoryLabel!);
    const minX = Math.min(...labels.map(label => label.left));
    if (minX < 0) {
      console.log('OLD WIDTH', this._width);
      this._parent.logicalWidth += -minX;
      console.log('NEW WIDTH', this._width, minX);
      this.datapointViews.forEach(dp => {
        dp.x += -minX; 
      });
      this._cx += -minX;
    }
    const maxX = Math.max(...labels.map(label => label.right));
    if (maxX > this._width) {
      const diff = maxX - this._width;
      this._parent.logicalWidth += diff;
      console.log('NEW WIDTH', this._width);
    }
    const minY = Math.min(...labels.map(label => label.top));
    if (minY < 0) {
      this._parent.logicalHeight += -minY;
      console.log('NEW HEIGHT', this._height);
      this.datapointViews.forEach(dp => {
        dp.y += -minY; 
      });
      this._cy += -minY;
    }
    const maxY = Math.max(...labels.map(label => label.bottom));
    if (maxY > this._height) {
      const diff = maxY - this._height;
      this._parent.logicalHeight += diff;
      console.log('NEW HEIGHT', this._height);
    }
  }

  protected _createDatapoints() {
    const xs = this.paraview.store.model!.series[0].facet('x')!.map(box =>
      box.value as string
    );
    const ys = this.paraview.store.model!.series[0].facet('y')!.map(box =>
      box.value as number);

    // const indep = this._model.indepVar;
    // const xs: string[] = [];
    // for (const [i, record] of this._model.data) {
    //   xs.push(this._model.format(
    //     xSeries.atBoxed(i), `${this.parent.docView.type as RadialChartType}Slice`));
    //   //const xId = utils.strToId(xs.at(-1)!);
    //   //todo().canvas.jimerator.addSelector(indep, i, `tick-x-${xId}`);
    // }

    const total = ys.reduce((a, b) => a + b, 0);
    const seriesView = new SeriesView(this, this.paraview.store.model!.keys[0], false);
    this._chartLandingView.append(seriesView);

    let accum = 0;
    for (const [x, i] of enumerate(xs)) {
      const currDatapoint = ys.at(i)!;

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
        numDatapoints: xs.length
      });
      seriesView.append(datapointView);
      accum += percentage;
      //todo().canvas.jimerator.addSelector(ySeries.name!, i, datapointView.id);
    }
  }

  protected _createLabels() {
    const xs = this.paraview.store.model!.series[0].facet('x')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceLabel'))
    );
    const ys = this.paraview.store.model!.series[0].facet('y')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceLabel'))
    );
    for (const [x, i] of enumerate(xs)) {
      const slice = this._chartLandingView.children[0].children[i] as RadialSlice;
      const arcCenter = slice.shape.arcCenter;
      const gapVec = slice.shape.orientationVector.multiplyScalar(10);
      let labelLoc: Vec2;
      let anchor: LabelTextAnchor;
      const sliceCenter = slice.shape.loc.add(arcCenter).divideScalar(2);
      if (this.settings.categoryLabelPosition === 'inside') {
        labelLoc = sliceCenter;
        anchor = 'middle';
      } else if (this.settings.categoryLabelPosition === 'outside') {
        labelLoc = arcCenter.add(gapVec);
        if (labelLoc.x > this.cx) {
          labelLoc.x += 5;
          anchor = 'start';
        } else {
          labelLoc.x -= 5;
          anchor = 'end';
        }
      } else {
        labelLoc = new Vec2();
        anchor = 'middle';
      }
      slice.categoryLabel = new Label(this.paraview, {
        text: x, 
        classList: ['radial-category-label'], 
        role: 'axislabel', 
        loc: labelLoc,
        textAnchor: anchor,
        isPositionAtAnchor: true
      });
      const underlineStart = labelLoc
        //.addX(slice.categoryLabel.textAnchor === 'start' ? 5 : -5)
        .addY(this.settings.categoryLabelUnderlineGap);
      slice.leader = new Path(this.paraview, {
        points: [arcCenter, underlineStart, underlineStart.x > slice.categoryLabel.centerX
          ? underlineStart.subtractX(slice.categoryLabel.width)
          : underlineStart.addX(slice.categoryLabel.width)],
        stroke: this.paraview.store.colors.colorValueAt(slice.color),
        strokeWidth: 2
      });
      slice.valueLabel = new Label(this.paraview, {
        // XXX value will not always be a percentage
        text: ys[i] + '%', 
        classList: ['radial-value-label'], 
        role: 'axislabel', 
        loc: sliceCenter.add(slice.shape.orientationVector.multiplyScalar(40)),
        textAnchor: 'middle',
        isPositionAtAnchor: true,
      });
      slice.valueLabel.styleInfo = {
        fill: this.paraview.store.colors.contrastValueAt(i)
      };
      // Labels draw as children of the slice so the highlights layer can `use` them
      slice.append(slice.leader);
      slice.append(slice.categoryLabel);
      slice.append(slice.valueLabel);
    }
    this._resolveLabelCollisions();
  }

  protected _resolveLabelCollisions() {
    const slices = [...this.datapointViews] as RadialSlice[];
    // Sort slices according to label height onscreen from lowest to highest
    slices.sort((a, b) => b.categoryLabel!.y - a.categoryLabel!.y);

    // const leaderLabelOffset = this.paraview.store.settings.chart.isDrawSymbols 
    //   ? -this._chart.settings.seriesLabelPadding 
    //   : 0;

    slices.slice(1).forEach((s, i) => {
      // Move each label up out of collision with the one onscreen below it.
      if (s.categoryLabel!.intersects(slices[i].categoryLabel!)) {
        const oldY = s.categoryLabel!.y;
        s.categoryLabel!.y = slices[i].categoryLabel!.y - s.categoryLabel!.height;
        const diff = s.categoryLabel!.y - oldY;
        s.leader!.points = [
          s.leader!.points[0],
          s.leader!.points[1].addY(diff),
          s.leader!.points[2].addY(diff)];
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
    const xs = this.paraview.store.model!.series[0].facet('x')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceLabel')));
    const ys = this.paraview.store.model!.series[0].facet('y')!.map(box =>
      formatBox(box, this.paraview.store.getFormatType('pieSliceValue')));
    return xs.map((x, i) => ({
      label: `${x}: ${ys[i]}`,
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

  /**
   * Navigate to the series minimum/maximum datapoint
   * @param isMin If true, go the the minimum. Otherwise, go to the maximum
   */
  protected _goSeriesMinMax(isMin: boolean) {
    const currView = this.focusLeaf;
    if (currView instanceof ChartLandingView) {
      this._goChartMinMax(isMin);
    } else {
      let seriesChildren = null;
      let seriesKey = null;
      let index: number | null = null;

      if (currView instanceof SeriesView) {
        seriesKey = currView.seriesKey;
        seriesChildren = currView.children;
      } else if (currView instanceof DatapointView) {
        seriesKey = currView.seriesKey;
        index = currView.index;
        seriesChildren = currView.parent!.children;
      }

      if (seriesChildren && seriesKey) {
        const stats = this.paraview.store.model!.getFacetStats('y')!;
        // Indices of min/max values
        const seriesMatchArray = isMin 
          ? stats.min.datapoints.map(dp => dp.datapointIndex)   
          : stats.max.datapoints.map(dp => dp.datapointIndex);
        if (index !== null && seriesMatchArray.length > 1) {
          // TODO: If there is more than one datapoint that has the same series minimum value, find the next one to nav to:
          //       Find the current x label, if it matches one in `seriesMins`, 
          //       remove all entries up to and including that point,
          //       and use the next item on the list.
          //       But also cycle around if it's the last item in the list
          const currentRecordIndex = seriesMatchArray.indexOf(index);
          if (currentRecordIndex !== -1 && currentRecordIndex !== seriesMatchArray.length + 1) {
            seriesMatchArray.splice(0, currentRecordIndex);
          }
        }
        const newViews = seriesChildren.filter(view => 
          seriesMatchArray.includes(view.index));
        newViews[0]?.focus();
      }
    }
  }

  /**
   * Navigate to (one of) the chart minimum/maximum datapoint(s)
   * @param isMin If true, go the the minimum. Otherwise, go to the maximum
   */
  protected _goChartMinMax(isMin: boolean) {
    const currView = this.focusLeaf;
    const stats = this.paraview.store.model!.getFacetStats('y')!;
    const matchTarget = isMin ? stats.min.value : stats.max.value;
    const chartMatchArray = this._chartLandingView.datapointViews.filter(view =>
      // @ts-ignore
      view.datapoint.data.y.value === matchTarget);
    chartMatchArray[0].focus();
  }

  playRight() {
    
  }

  playLeft() {
    
  }

  queryData(): void {
      const targetView = this.chartLandingView.focusLeaf
      // TODO: localize this text output
      // focused view: e.options!.focus
      // all visited datapoint views: e.options!.visited
      // const focusedDatapoint = e.targetView;
      let msgArray: string[] = [];
      let seriesLengths = [];
      for (let series of this.paraview.store.model!.series) {
        seriesLengths.push(series.rawData.length)
      }
      if (targetView instanceof ChartLandingView) {
        this.paraview.store.announce(`Displaying Chart: ${this.paraview.store.title}`);
        return
      }
      else if (targetView instanceof SeriesView) {
        msgArray.push(interpolate(
          queryMessages.seriesKeyLength,
          { seriesKey: targetView.seriesKey, datapointCount: targetView.series.length }
        ));
        //console.log('queryData: SeriesView:', targetView);
      }
      else if (targetView instanceof DatapointView) {
        const selectedDatapoints = this.paraview.store.selectedDatapoints;
        const visitedDatapoint = this.paraview.store.visitedDatapoints[0];
        /*
        msgArray.push(replace(
          queryMessages.datapointKeyLength,
          {
            seriesKey: targetView.seriesKey,
            datapointXY: `${targetView.series[visitedDatapoint.index].x.raw}, ${targetView.series[visitedDatapoint.index].y.raw}`,
            datapointIndex: targetView.index + 1,
            datapointCount: targetView.series.length
          }
        ));
        */
        //console.log(msgArray)
        if (selectedDatapoints.length) {
          console.log("in here")
          const selectedDatapointViews = []

          for (let datapoint of selectedDatapoints) {
            const selectedDatapointView = targetView.chart.datapointViews.filter(datapointView => datapointView.seriesKey === datapoint.seriesKey)[datapoint.index];
            selectedDatapointViews.push(selectedDatapointView)
          }
          // if there are selected datapoints, compare the current datapoint against each of those
          //console.log(targetView.series.rawData)
          const selectionMsgArray = describeSelections(this.paraview, targetView, selectedDatapointViews as DatapointView[]);
          msgArray = msgArray.concat(selectionMsgArray);
        } else {
          //console.log('tv', targetView)
          // If no selected datapoints, compare the current datapoint to previous and next datapoints in this series
          msgArray.push(interpolate(
            queryMessages.percentageOfChart,
            {
              chartKey: targetView.seriesKey,
              datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
              datapointIndex: targetView.index + 1,
              datapointCount: targetView.series.length
            }));
          if (this.paraview.store.model!.numSeries > 1) {
            msgArray.push(interpolate(
              queryMessages.percentageOfSeries,
              {
                seriesKey: targetView.seriesKey,
                datapointXY: `${targetView.series[visitedDatapoint.index].facetBox("x")!.raw}, ${targetView.series[visitedDatapoint.index].facetBox("y")!.raw}`,
                datapointIndex: targetView.index + 1,
                datapointCount: targetView.series.length
              }));
          }
          //const datapointMsgArray = describeAdjacentDatapoints(this.paraview, targetView);
          //msgArray = msgArray.concat(datapointMsgArray);
        } 
        // also add the high or low indicators
        const minMaxMsgArray = getDatapointMinMax(this.paraview,
          targetView.series[visitedDatapoint.index].facetBox("y")!.raw as unknown as number, targetView.seriesKey);
        //console.log('minMaxMsgArray', minMaxMsgArray)z
        msgArray = msgArray.concat(minMaxMsgArray)
      }
      this.paraview.store.announce(msgArray);
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

  protected _categoryLabel: Label | null = null;
  protected _valueLabel: Label | null = null;
  protected _leader: Path | null = null;
  
  constructor(parent: SeriesView, protected _params: RadialDatapointParams) {
    super(parent);
    this._isStyleEnabled = true;
  }

  get categoryLabel() {
    return this._categoryLabel;
  }

  set categoryLabel(label: Label | null) {
    this._categoryLabel = label;
  }

  get valueLabel() {
    return this._valueLabel;
  }

  set valueLabel(label: Label | null) {
    this._valueLabel = label;
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

  get classInfo() {
    const classInfo: ClassInfo = {['radial-slice']: true, ...super.classInfo};
    return classInfo;
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
    if (this._categoryLabel) {
      this._categoryLabel.x += x - this._x;
    }
    if (this._valueLabel) {
      this._valueLabel.x += x - this._x;
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
    if (this._categoryLabel) {
      this._categoryLabel.y += y - this._y;
    }
    if (this._valueLabel) {
      this._valueLabel.y += y - this._y;
    }
    if (this._leader) {
      this._leader.y += y - this._y;
    }
    super.y = y;
  }

  protected _createSymbol() {
  }

  completeLayout() {
    super.completeLayout();
  }

}