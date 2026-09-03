import { PlotLayer } from '../layer';
import { View, Container } from '../../base_view';
import { type ViewContext } from '../../view_context';
import { RectShape, PathShape } from '../../shape';
import { Vec2 } from '../../../common/vector';
import { type PointAnnotation, datapointIdToCursor } from '../../../state/parastate';
import { Popup } from '../../popup';
import { PlaneChartInfo } from '../../../chart_types';
import { type ScatterPlotView } from '../data/chart_type/scatter_plot_view';
import { TrendLineView } from '../data/chart_type/point_plot_view';
import { ConfigSetting } from '../../../config/config_types';
import { svg } from 'lit';
import { ParaView } from '../../../paraview';

export type AnnotationType = 'foreground' | 'background';

export class AnnotationLayer extends PlotLayer {
  protected _groups = new Map<string, DecorationGroup>();

  constructor(paraview: ViewContext, width: number, height: number, public readonly type: AnnotationType) {
    super(paraview, width, height);
  }

  protected _createId() {
    return super._createId(`${this.type}-annotation`);
  }

  group(name: string) {
    return this._groups.get(name);
  }

  addGroup(name: string, okIfExist = false) {
    if (this._groups.has(name)) {
      if (okIfExist) {
        return;
      }
      throw new Error(`group '${name}' already exists`);
    }
    this._groups.set(name, new DecorationGroup(this.paraview, name));
    this.append(this._groups.get(name)!);
  }

  removeGroup(name: string, okIfNotExist = false) {
    if (this._groups.has(name)) {
      this._groups.get(name)?.children.forEach(c => c.remove())
      this._groups.get(name)?.remove();
      this._groups.delete(name);
    } else if (okIfNotExist) {
      return;
    }
    else {
      throw new Error(`group '${name}' does not exist`);
    }
  }

  settingDidChange(path: string, oldValue?: ConfigSetting, newValue?: ConfigSetting): void {
    if (['ui.isLowVisionModeEnabled'].includes(path)) {
      if (!oldValue) {
        for (let annot of this.paraview.paraState.annotations) {
          annot.isSelected = false;
        }
      }
    }
  }

  renderChildren() {
    if (this.type === 'foreground') {
      if (this.paraview.paraState.modelTrendLines && this.paraview.paraState.chartInfo instanceof PlaneChartInfo) {
        this.addGroup('trend-lines', true);
        this.group('trend-lines')!.clearChildren();
        for (const tl of this.paraview.paraState.modelTrendLines) {
          const series = this.paraview.paraState.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0];
          const range = this.paraview.paraState.chartInfo.yRangeInfo!;
          const minValue = range.interval.start;
          const maxValue = range.interval.end;
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this.paraview.paraState.colors.colorValue('visit');
          const trendLine = new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [new Vec2(startPx, startHeight), new Vec2(endPx, endHeight),],
            fill: colorValue,
            stroke: colorValue
          });
          trendLine.classInfo = { 'trend-line': true }
          this.group('trend-lines')!.append(trendLine);
        }
      }
      else {
        if (this._groups.has('trend-lines')) {
          this.removeGroup('trend-lines', true);
        }
      }

      if (this.paraview.paraState.userTrendLines && this.paraview.paraState.chartInfo instanceof PlaneChartInfo) {
        this.addGroup('user-trend-lines', true);
        this.group('user-trend-lines')!.clearChildren();
        let tls = structuredClone(this.paraview.paraState.userTrendLines);
        if (this.paraview.paraState.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this.paraview.paraState.visitedDatapoints.values().toArray()[0]);
          tls = tls.filter(a => a.seriesKey == cursor.seriesKey)
        }
        for (const tl of tls) {
          const series = this.paraview.paraState.model!.series.filter(s => s[0].seriesKey == tl.seriesKey)[0]
          const range = this.paraview.paraState.chartInfo.yRangeInfo!;
          const minValue = range.interval.start;
          const maxValue = range.interval.end;
          const startHeight = this.height - (series.datapoints[tl.startIndex].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const endHeight = this.height - (series.datapoints[tl.endIndex - 1].facetValueNumericized("y")! - minValue) / (maxValue - minValue) * this.height;
          const startPx = this.width * tl.startPortion;
          const endPx = this.width * tl.endPortion;
          const colorValue = this.paraview.paraState.colors.colorValue('highlight');
          const trendLine = new PathShape(this.paraview, {
            x: this._x,
            y: this._y,
            points: [new Vec2(startPx, startHeight), new Vec2(endPx, endHeight),],
            fill: colorValue,
            stroke: colorValue
          });
          trendLine.classInfo = { 'user-trend-line': true }
          this.group('user-trend-lines')!.append(trendLine);
        }
      }
      else {
        if (this._groups.has('user-trend-lines')) {
          this.removeGroup('user-trend-lines', true);
        }
      }
      if (this.paraview.paraState.config.type.scatter.isShowTrendLine && this.paraview.paraState.chartInfo instanceof PlaneChartInfo) {
        this.removeGroup('overall-trend-line', true);
        this.addGroup('overall-trend-line', true);
        this.group('overall-trend-line')!.clearChildren();
        const chart = this.paraview.documentView!.chartLayers.dataLayer! as ScatterPlotView;
        if (chart._trendLine) {
          chart._trendLine.remove();
        }
        const trendLine = new TrendLineView(chart);
        chart._trendLine = trendLine;
        this.group('overall-trend-line')!.append(trendLine);
      }
      else {
        if (this._groups.has('overall-trend-line')) {
          this.removeGroup('overall-trend-line', true);
        }
      }
      if (this.paraview.paraState.clusterShellViews.length > 0) {
        this.removeGroup('cluster-shell', true);
        this.addGroup('cluster-shell', true);
        this.group('cluster-shell')!.clearChildren();
        for (let shell of this.paraview.paraState.clusterShellViews) {
          this.group('cluster-shell')!.append(shell);
        }
      }
      else {
        if (this._groups.has('cluster-shell')) {
          this.removeGroup('cluster-shell', true);
        }
      }

      if (this.paraview.paraState.annotations) {
        this.addGroup('annotation-popups', true);
        this.group('annotation-popups')!.clearChildren();
        let annots = structuredClone(this.paraview.paraState.annotations.filter(a => a.type == 'datapoint' && a.isSelected == true) as unknown as PointAnnotation[]);
        /*
        for (let dp of this.paraview.paraState.visitedDatapoints){
          let cursor = datapointIdToCursor(dp)
          let dpView = this.paraview.documentView!.chartLayers.dataLayer.datapointView(cursor.seriesKey, cursor.index)
          for (let annot of this.paraview.paraState.annotations){
            if (dpView!.seriesKey === annot.seriesKey && dpView!.index === annot.index && !annot.isSelected){
              annots.push(annot as PointAnnotation)
            }
          }
        }
          */
        for (const annot of annots) {
          const seriesKey = this.paraview.paraState.model!.series.filter(s => s[0].seriesKey == annot.seriesKey)[0].key
          const dpView = this.paraview.documentView?.chartLayers.dataLayer.datapointViews.filter(d => d.seriesKey == seriesKey && d.index == annot.index)[0]
          if (!dpView) {
            break
          }
          let popup = new Popup(this.paraview,
            {
              text: annot.text,
              x: dpView.x,
              y: dpView.y,
              id: this.id,
              colorIndex: dpView.colorIndex,
              points: [dpView]
            },
            {
              fill: this.paraview.paraState.config.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 100%)"
                : this.paraview.paraState.config.popup.backgroundColor === "light" ?
                  this.paraview.paraState.colors.lighten(this.paraview.paraState.colors.colorValueAt(dpView.colorIndex), 6)
                  : this.paraview.paraState.colors.colorValueAt(dpView.colorIndex),
              stroke: this.paraview.paraState.config.ui.isLowVisionModeEnabled ? "hsl(0, 0%, 0%)"
                : this.paraview.paraState.config.popup.backgroundColor === "light" ?
                  this.paraview.paraState.colors.colorValueAt(dpView.colorIndex)
                  : "black",
            })
          popup.classInfo = { 'popup': true }
          this.group('annotation-popups')!.append(popup);
        }

      }
      else {
        if (this._groups.has('annotation-popups')) {
          this.removeGroup('annotation-popups', true);
        }
      }


    }
    if (this.type === 'background') {
      if (this.paraview.paraState.rangeHighlights) {
        this.addGroup('range-highlights', true);
        this.group('range-highlights')!.clearChildren();
        for (const rhl of this.paraview.paraState.rangeHighlights) {
          const startPx = this.width * rhl.startPortion;
          const endPx = this.width * rhl.endPortion;
          const rect = new RectShape(this.paraview, {
            x: startPx,
            y: 0,
            width: endPx - startPx,
            height: this.height
          });
          rect.classInfo = { 'range-highlight': true };
          this.group('range-highlights')!.append(rect);
        }
      }
      else {
        if (this._groups.has('range-highlights')) {
          this.removeGroup('range-highlights', true);
        }
      }

      if (this.paraview.paraState.modelLineBreaks) {
        this.addGroup('linebreaker-markers', true);
        this.group('linebreaker-markers')!.clearChildren();
        for (const lb of this.paraview.paraState.modelLineBreaks) {
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this.paraview, {
            x: startPx - 1.5,
            y: 0,
            width: 3,
            height: this.height
          })
          linebreak.classInfo = { 'linebreaker-marker': true }
          this.group('linebreaker-markers')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('linebreaker-markers')) {
          this.removeGroup('linebreaker-markers', true);
        }
      }
      if (this.paraview.paraState.userLineBreaks) {
        this.addGroup('user-linebreaker-markers', true);
        this.group('user-linebreaker-markers')!.clearChildren();
        let lbs = structuredClone(this.paraview.paraState.userLineBreaks);
        if (this.paraview.paraState.visitedDatapoints.size > 0) {
          const cursor = datapointIdToCursor(this.paraview.paraState.visitedDatapoints.values().toArray()[0]);
          lbs = lbs.filter(a => a.seriesKey == cursor.seriesKey);
        }
        for (const lb of lbs) {
          const index = this.paraview.paraState.model!.series.findIndex(a => a.key == lb.seriesKey);
          const color = this.paraview.paraState.colors.colorValueAt(index)
          const startPx = this.width * lb.startPortion;
          const linebreak = new RectShape(this.paraview, {
            x: startPx - 1.5,
            y: 0,
            width: 3,
            height: this.height,
            fill: color
          })
          linebreak.classInfo = { 'user-linebreaker-marker': true }
          this.group('user-linebreaker-markers')!.append(linebreak);
        }
      }
      else {
        if (this._groups.has('user-linebreaks')) {
          this.removeGroup('userlinebreaks', true);
        }
      }

      if (this.paraview.paraState.thresholds) {
        this.addGroup('thresholds', true);
        this.group('thresholds')!.clearChildren();
        this.paraview.paraState.clearAllDatapointContrast();
        const sortedHorizThresholds = this.paraview.paraState.thresholds.filter(t => t.orientation == 'horiz').sort((a, b) => b.align - a.align);
        const sortedVertThresholds = this.paraview.paraState.thresholds.filter(t => t.orientation == 'vert').sort((a, b) => a.align - b.align);
        let runningY = 0;
        const clWidth = this.paraview.documentView!.chartLayers.width;
        const clHeight = this.paraview.documentView!.chartLayers.height;
        if (sortedHorizThresholds.length > 0 && sortedVertThresholds.length == 0) {
          for (let i = 0; i < sortedHorizThresholds.length; i++) {
            const threshold = sortedHorizThresholds[i]
            threshold.classInfo = { 'threshold': true };
            const clipBox = threshold.highlightPoints()!;
            const clipKey = `marker-clip-${i}`;   // unique key for addDef
            const clipId = `marker-clip-${i}`;    // id used in the clipPath element
            (this.paraview as ParaView).removeDef(clipKey);
            const x = clipBox[0].start * this.paraview.documentView!.chartLayers.width;
            const newY = clipBox[1].start * this.paraview.documentView!.chartLayers.height;
            const width = (clipBox[0].end - clipBox[0].start) * this.paraview.documentView!.chartLayers.width;
            const height = (clipBox[1].start) * this.paraview.documentView!.chartLayers.height - runningY;
            this.paraview.addDef(clipKey, svg`
                <clipPath id=${clipId}>
                  <rect x=${x} y=${runningY} width=${width} height=${height}></rect>
                </clipPath>
              `);
            runningY = newY;
          }

          const clipKey = `marker-clip-${sortedHorizThresholds.length}`;   // unique key for addDef
          const clipId = `marker-clip-${sortedHorizThresholds.length}`;    // id used in the clipPath element
          (this.paraview as ParaView).removeDef(clipKey);
          const width = this.paraview.documentView!.chartLayers.width;
          const height = this.paraview.documentView!.chartLayers.height - runningY;
          this.paraview.addDef(clipKey, svg`
                <clipPath id=${clipId}>
                  <rect x=${0} y=${runningY} width=${width} height=${height}></rect>
                </clipPath>
              `);
        }
        else if (sortedHorizThresholds.length == 0 && sortedVertThresholds.length > 0) {
          for (let i = 0; i < sortedVertThresholds.length; i++) {
            const threshold = sortedVertThresholds[i]
            threshold.classInfo = { 'threshold': true };
            const clipBox = threshold.highlightPoints()!;
            const clipKey = `marker-clip-${i}`;   // unique key for addDef
            const clipId = `marker-clip-${i}`;    // id used in the clipPath element
            (this.paraview as ParaView).removeDef(clipKey);
            const x = clipBox[0].start * this.paraview.documentView!.chartLayers.width;
            //const newY = clipBox[1].start * this.paraview.documentView!.chartLayers.height;
            const width = (clipBox[0].end - clipBox[0].start) * this.paraview.documentView!.chartLayers.width;
            const height =  this.paraview.documentView!.chartLayers.height;
            this.paraview.addDef(clipKey, svg`
                <clipPath id=${clipId}>
                  <rect x=${x} y=${runningY} width=${width} height=${height}></rect>
                </clipPath>
              `);
            //runningY = newY;
          }

          const clipKey = `marker-clip-${sortedVertThresholds.length}`;   // unique key for addDef
          const clipId = `marker-clip-${sortedVertThresholds.length}`;    // id used in the clipPath element
          (this.paraview as ParaView).removeDef(clipKey);
          const width = this.paraview.documentView!.chartLayers.width;
          const height = this.paraview.documentView!.chartLayers.height;
          this.paraview.addDef(clipKey, svg`
                <clipPath id=${clipId}>
                  <rect x=${0} y=${runningY} width=${width} height=${height}></rect>
                </clipPath>
              `);
        }
        else {
          for (let i = 0; i < sortedHorizThresholds.length + 1; i++) {
            let runningX = 0;
            let newY = 0;
            for (let j = 0; j < sortedVertThresholds.length + 1; j++) {
              const id = j + i * (sortedVertThresholds.length + 1);
              const clipKey = `marker-clip-${id}`;   // unique key for addDef
              const clipId = `marker-clip-${id}`;    // id used in the clipPath element
              (this.paraview as ParaView).removeDef(clipKey);
              if (i < sortedHorizThresholds.length && j < sortedVertThresholds.length) {
                const horizThreshold = sortedHorizThresholds[i];
                const vertThreshold = sortedVertThresholds[j];
                const horizClipBox = horizThreshold.highlightPoints()!;
                const vertClipBox = vertThreshold.highlightPoints()!;
                const newX = vertClipBox[0].start * clWidth;
                newY = horizClipBox[1].start * clHeight;
                const width = (vertClipBox[0].start) * clWidth - runningX;
                const height = (horizClipBox[1].start) * clHeight - runningY;
                this.paraview.addDef(clipKey, svg`
                  <clipPath id=${clipId}>
                    <rect x=${runningX} y=${runningY} width=${width} height=${height}></rect>
                  </clipPath>
                  `);
                runningX = newX;
              }
              else if (i == sortedHorizThresholds.length && j == sortedVertThresholds.length) {
                const newX = runningX;
                newY = runningY;
                const width = clWidth - runningX;
                const height = clHeight - runningY;
                this.paraview.addDef(clipKey, svg`
                  <clipPath id=${clipId}>
                    <rect x=${runningX} y=${runningY} width=${width} height=${height}></rect>
                  </clipPath>
                  `);
                runningX = newX;
              }
              else if (i == sortedHorizThresholds.length) {
                const vertThreshold = sortedVertThresholds[j];
                const vertClipBox = vertThreshold.highlightPoints()!;
                const newX = vertClipBox[0].start * clWidth;
                newY = runningY;
                const width = (vertClipBox[0].start) * clWidth - runningX;
                const height = clHeight - runningY;
                this.paraview.addDef(clipKey, svg`
                  <clipPath id=${clipId}>
                    <rect x=${runningX} y=${runningY} width=${width} height=${height}></rect>
                  </clipPath>
                  `);
                runningX = newX;
              }
              else if (j == sortedVertThresholds.length) {
                const horizThreshold = sortedHorizThresholds[i];
                const horizClipBox = horizThreshold.highlightPoints()!;
                const newX = runningX;
                newY = horizClipBox[1].start * clHeight;
                const width = clWidth - runningX;
                const height = (horizClipBox[1].start) * clHeight - runningY;
                this.paraview.addDef(clipKey, svg`
                  <clipPath id=${clipId}>
                    <rect x=${runningX} y=${runningY} width=${width} height=${height}></rect>
                  </clipPath>
                  `);
                runningX = newX;
              }
            }
            runningY = newY;
          }
        }
        for (let threshold of this.paraview.paraState.thresholds) {
          threshold.classInfo = { 'threshold': true };
          this.group('thresholds')!.append(threshold);
        }
      }
      else {
        if (this._groups.has('thresholds')) {
          this.removeGroup('thresholds', true);
        }
      }
    }
    return super.renderChildren();
  }
}

class DecorationGroup extends Container(View) {

  constructor(paraview: ViewContext, protected _name: string) {
    super(paraview);
  }

  get name() {
    return this._name;
  }

}