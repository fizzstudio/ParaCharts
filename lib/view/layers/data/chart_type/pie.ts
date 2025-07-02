
import { RadialChart, RadialSlice, type RadialDatapointParams } from '.';
import { type SeriesView } from '../../../data';
import { SectorShape } from '../../../shape/sector';
import { type ParaView } from '../../../../paraview';

export class PieChart extends RadialChart {

  constructor(paraview: ParaView,  index: number) {
    super(paraview, index);
  }

  protected _playSeriesRiff() {
  }

  protected _createSlice(seriesView: SeriesView, params: RadialDatapointParams): RadialSlice {
    return new PieSlice(seriesView, params);
  }

}

export class PieSlice extends RadialSlice {

  constructor(parent: SeriesView, params: RadialDatapointParams) {
    super(parent, params);
    this._x = this.chart.cx;
    this._y = this.chart.cy;
    // const {x, y, className} = this._computeLabelOptions();
    // this._params.label.x = x;
    // this._params.label.y = y;
    // this._params.label.classList.push(className);
    // this._params.label.hidden = false;
    // this.append(this._params.label);
  }

  get width() {
    // XXX
    return 0;
  }

  get height() {
    // XXX
    return 0;
  }

  protected _createShape() {
    const isPattern = this.paraview.store.colors.palette.isPattern;
    this._shape = new SectorShape(this.paraview, {
      x: this._x,
      y: this._y,
      r: this.chart.radius,
      centralAngle: this._params.percentage*360,
      orientationAngle: this._params.accum*360,
      annularThickness: this.chart.settings.annularThickness,
      isPattern: isPattern ? true : false
    });
    super._createShape();
  }

  // protected _computeLabelOptions() {
  //   const r = this.chart.radius.outer;
  //   const sector = (this._children[0] as Sector);
  //   const centerAngle = sector.options.orientationAngle + sector.options.centralAngle/2;
  //   let className = 'radial_label';
  //   // if (centerAngle >= 0.05 && centerAngle <= 0.45) {
  //   //   className = 'radial_label_right';
  //   // } else if (centerAngle >= 0.55 && centerAngle <= 0.95) {
  //   //   className = 'radial_label_left';
  //   // }

  //   // console.log('LABEL OPTS', r, centerAngle, this.chart.cx, this.chart.cy, this._radians);

  //   return {
  //     x: this.chart.cx + r*Math.cos(centerAngle*Math.PI/180),
  //     y: this.chart.cy + r*Math.sin(centerAngle*Math.PI/180),
  //     className
  //   };
  // }

  get selectedMarker() {
    return new SectorShape(this.paraview, {
      x: this._x,
      y: this._y,
      r: this.chart.radius,
      centralAngle: this._params.percentage*360,
      orientationAngle: this._params.accum*360,
      annularThickness: this.chart.settings.annularThickness,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }
}