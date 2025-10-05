
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

  protected _createShapes() {
    const isPattern = this.paraview.store.colors.palette.isPattern;
    const slice = new SectorShape(this.paraview, {
      x: this._x,
      y: this._y,
      r: this.chart.radius,
      centralAngle: this._params.percentage*360,
      orientationAngle: this._params.accum*360,
      orientationAngleOffset: this.chart.settings.orientationAngleOffset,
      annularThickness: this.chart.settings.annularThickness,
      isPattern: isPattern ? true : false,
      pointerEnter: (e) => {
        this.paraview.store.settings.chart.showPopups ? this.addPopup() : undefined
      },
      pointerLeave: (e) => {
        this.paraview.store.settings.chart.showPopups ? this.removePopup(this.id) : undefined
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
      orientationAngleOffset: this.chart.settings.orientationAngleOffset,
      annularThickness: this.chart.settings.annularThickness,
      fill: 'none',
      stroke: 'black',
      strokeWidth: 2
    });
  }

  addPopup() {
    if (this.paraview.store.popups.some(p => p.id == this.id)){
      return
    }
    let angle = 2 * Math.PI - ((this._params.accum * 2 * Math.PI) + (this._params.percentage * Math.PI) - (this.chart.settings.orientationAngleOffset * 2 * Math.PI / 360))
    let x = this.x + this.chart.radius * (1 - this.chart.settings.annularThickness / 2) * Math.cos(angle)
    let y = this.y - this.chart.radius * (1 - this.chart.settings.annularThickness / 2) * Math.sin(angle)
    let popup = new Popup(this.paraview,
      {
        text: this.chart.chartInfo.summarizer.getDatapointSummary(this.datapoint, 'statusBar'),
        x: x,
        y: y,
        textAnchor: "middle",
        classList: ['annotationlabel'],
        id: this.id,
        color: this.color
      },
      {
        shape: "boxWithArrow",
        fill: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
          : this.paraview.store.settings.popup.backgroundColor === "light" ?
            this.paraview.store.colors.lighten(this.paraview.store.colors.colorValueAt(this.color), 6)
            : this.paraview.store.colors.colorValueAt(this.color),
        stroke: this.paraview.store.settings.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
          : this.paraview.store.settings.popup.backgroundColor === "light" ?
            this.paraview.store.colors.colorValueAt(this.color)
            : "black",
      })
    this.paraview.store.popups.push(popup)
  }

  removePopup(id: string) {
    let coords = this.paraview.pointerEventManager!.coords!
    let relativeX = coords.x - this.paraview.documentView!.padding.left - this.paraview.documentView!.chartLayers.x
    let relativeY = coords.y - this.paraview.documentView!.padding.top - this.paraview.documentView!.chartLayers.y
    let popup = this.paraview.store.popups.find(p => p.id === id)!
    this.paraview.store.popups.splice(this.paraview.store.popups.findIndex(p => p.id === id), 1)
    if (!popup){
      return
    }
    if (relativeX <= popup.box.right && relativeX >= popup.box.left && relativeY >= popup.box.top && relativeY <= popup.box.bottom){
      return
    }
    this.paraview.requestUpdate()
  }
}