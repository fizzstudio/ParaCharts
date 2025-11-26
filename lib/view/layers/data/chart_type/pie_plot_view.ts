
import { Logger, getLogger } from '../../../../common/logger';
import { PastryPlotView, RadialSlice, type RadialDatapointParams } from '.';
import { type SeriesView } from '../../../data';
import { Popup } from '../../../popup';
import { SectorShape } from '../../../shape/sector';

export class PiePlotView extends PastryPlotView {

  protected _createSlice(seriesView: SeriesView, params: RadialDatapointParams): RadialSlice {
    return new PieSlice(seriesView, params);
  }

}

export class PieSlice extends RadialSlice {
  constructor(parent: SeriesView, params: RadialDatapointParams) {
    super(parent, params);
    this.log = getLogger("PieSlice");
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

  computeLocation(): void {
    if (this.paraview.store.settings.animation.isAnimationEnabled) {
      this._centralAngle = this.chart.animateRevealComplete
        ? this._params.percentage*360
        : 0;
    } else {
      this._centralAngle = this._params.percentage*360;
    }
  }

  beginAnimStep(bezT: number, linearT: number): void {
    this._centralAngle = this._params.percentage*360*bezT;
    super.beginAnimStep(bezT, linearT);
  }

  protected _createShapes() {
    const isPattern = this.paraview.store.colors.palette.isPattern;
    this._shapes.forEach(shape => {
      shape.remove();
    });
    this._shapes = [];
    const slice = new SectorShape(this.paraview, {
      x: this._x,
      y: this._y,
      r: this.chart.radius,
      centralAngle: this._centralAngle,
      orientationAngle: this._params.accum*360,
      orientationAngleOffset: this.chart.settings.orientationAngleOffset,
      annularThickness: this.chart.settings.annularThickness,
      isPattern: isPattern ? true : false,
      pointerEnter: (e) => {
        this.paraview.store.settings.chart.isShowPopups ? this.addPopup() : undefined
      },
      pointerMove: (e) => {
        if (this._popup) {
          this._popup.grid.x = this.paraview.store.pointerChords.x
          this._popup.grid.y = this.paraview.store.pointerChords.y - this.paraview.store.settings.popup.margin
          this._popup.shiftGrid()
          this._popup.box.x = this._popup.grid.x
          this._popup.box.y = this._popup.grid.bottom
          this.paraview.requestUpdate()
        }
      },
      pointerLeave: (e) => {
        this.paraview.store.settings.chart.isShowPopups ? this.removePopup(this.id) : undefined
      },
    });
    this._shapes.push(slice);
    const explode = this.chart.settings.explode.split(':').map(idx => parseInt(idx));
    if (explode.includes(this.index)) {
      slice.loc = slice.loc.add(slice.orientationVector.multiplyScalar(this.chart.settings.explodeDistance));
    }
    super._createShapes();
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

  //   // this.log.info('LABEL OPTS', r, centerAngle, this.chart.cx, this.chart.cy, this._radians);

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
      orientationAngleOffset: this.chart.settings.orientationAngleOffset,
      annularThickness: this.chart.settings.annularThickness,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }

  addPopup(text?: string) {
    if (this.paraview.store.popups.some(p => p.id == this.id)){
      return
    }
    let angle = 2 * Math.PI - ((this._params.accum * 2 * Math.PI) + (this._params.percentage * Math.PI) - (this.chart.settings.orientationAngleOffset * 2 * Math.PI / 360))
    let x = this.x + this.chart.radius * (1 - this.chart.settings.annularThickness / 2) * Math.cos(angle)
    let y = this.y - this.chart.radius * (1 - this.chart.settings.annularThickness / 2) * Math.sin(angle)
    let datapointText = `${this.index + 1}/${this.series.datapoints.length}: ${this.chart.chartInfo.summarizer.getDatapointSummary(this.datapoint, 'statusBar')}`
    if (this.paraview.store.model!.multi) {
      datapointText = `${this.series.getLabel()} ${datapointText}`
    }
    let popup = new Popup(this.paraview,
      {
        text: text ?? datapointText,
        x: x,
        y: y,
        id: this.id,
        color: this.color,
        points: [this]
      },
      {
        shape: "box"
      })
    this.paraview.store.popups.push(popup)
    this._popup = popup;
  }
}