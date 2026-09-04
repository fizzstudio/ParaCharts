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
import { ConfigSetting, MarkerConfig } from '../../../config/config_types';
import { svg } from 'lit';
import { ParaView } from '../../../paraview';
import { SettingsManager } from '../../../state';

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
        const backgroundHighlights: RectShape[] = [];
        const addDef = (key: string, x: number, y: number, width: number, height: number) => {
          this.paraview.addDef(key, svg`
                <clipPath id=${key}>
                  <rect x=${x} y=${y} width=${width} height=${height}></rect>
                </clipPath>
              `);
          const rect = new RectShape(this.paraview, {
            x: x,
            y: y,
            width: width,
            height: height,
            opacity: .15,
            fill: 'red'
          })
          backgroundHighlights.push(rect);
        }
        const sortedHorizThresholds = this.paraview.paraState.thresholds.filter(t => t.orientation == 'horiz').sort((a, b) => b.align - a.align);
        const sortedVertThresholds = this.paraview.paraState.thresholds.filter(t => t.orientation == 'vert').sort((a, b) => a.align - b.align);
        let runningY = 0;
        let runningX = 0;
        const clWidth = this.paraview.documentView!.chartLayers.width;
        const clHeight = this.paraview.documentView!.chartLayers.height;
        if (sortedHorizThresholds.length > 0 && sortedVertThresholds.length == 0) {
          for (let i = 0; i < sortedHorizThresholds.length; i++) {
            const threshold = sortedHorizThresholds[i]
            threshold.classInfo = { 'threshold': true };
            const clipBox = threshold.highlightPoints()!;
            const clipId = `marker-clip-${i}`;
            (this.paraview as ParaView).removeDef(clipId);
            const newX = clipBox[0].start * clWidth;
            const newY = clipBox[1].start * clHeight;
            const height = (clipBox[1].start) * clHeight - runningY;
            addDef(clipId, newX, runningY, clWidth, height);
            runningY = newY;
          }
          const clipId = `marker-clip-${sortedHorizThresholds.length}`;
          (this.paraview as ParaView).removeDef(clipId);
          const height = clHeight - runningY;
          addDef(clipId, 0, runningY, clWidth, height);
        }
        else if (sortedHorizThresholds.length == 0 && sortedVertThresholds.length > 0) {
          for (let i = 0; i < sortedVertThresholds.length; i++) {
            const threshold = sortedVertThresholds[i]
            threshold.classInfo = { 'threshold': true };
            const clipBox = threshold.highlightPoints()!;
            const clipId = `marker-clip-${i}`;
            (this.paraview as ParaView).removeDef(clipId);
            const newX = clipBox[0].start * clWidth;
            const width = (clipBox[0].start) * clWidth - runningX;
            addDef(clipId, runningX, runningY, width, clHeight);
            runningX = newX
          }
          const clipId = `marker-clip-${sortedVertThresholds.length}`;
          (this.paraview as ParaView).removeDef(clipId);
          const width = clWidth - runningX;
          addDef(clipId, runningX, 0, width, clHeight);
        }
        else {
          for (let i = 0; i < sortedHorizThresholds.length + 1; i++) {
            let runningX = 0;
            let newY = 0;
            let newX = 0;
            for (let j = 0; j < sortedVertThresholds.length + 1; j++) {
              const id = j + i * (sortedVertThresholds.length + 1);
              const clipId = `marker-clip-${id}`;
              (this.paraview as ParaView).removeDef(clipId);
              if (i < sortedHorizThresholds.length && j < sortedVertThresholds.length) {
                const horizThreshold = sortedHorizThresholds[i];
                const vertThreshold = sortedVertThresholds[j];
                const horizClipBox = horizThreshold.highlightPoints()!;
                const vertClipBox = vertThreshold.highlightPoints()!;
                newX = vertClipBox[0].start * clWidth;
                newY = horizClipBox[1].start * clHeight;
                const width = (vertClipBox[0].start) * clWidth - runningX;
                const height = (horizClipBox[1].start) * clHeight - runningY;
                addDef(clipId, runningX, runningY, width, height);
              }
              else if (i == sortedHorizThresholds.length && j == sortedVertThresholds.length) {
                newX = runningX;
                newY = runningY;
                const width = clWidth - runningX;
                const height = clHeight - runningY;
                addDef(clipId, runningX, runningY, width, height);
              }
              else if (i == sortedHorizThresholds.length) {
                const vertThreshold = sortedVertThresholds[j];
                const vertClipBox = vertThreshold.highlightPoints()!;
                newX = vertClipBox[0].start * clWidth;
                newY = runningY;
                const width = (vertClipBox[0].start) * clWidth - runningX;
                const height = clHeight - runningY;
                addDef(clipId, runningX, runningY, width, height);
              }
              else if (j == sortedVertThresholds.length) {
                const horizThreshold = sortedHorizThresholds[i];
                const horizClipBox = horizThreshold.highlightPoints()!;
                newX = runningX;
                newY = horizClipBox[1].start * clHeight;
                const width = clWidth - runningX;
                const height = (horizClipBox[1].start) * clHeight - runningY;
                addDef(clipId, runningX, runningY, width, height);

              }
              runningX = newX;
            }
            runningY = newY;
          }
        }
        for (let i = 0; i < backgroundHighlights.length; i++) {
          const rect = backgroundHighlights[i]
          const config = SettingsManager.getGroupLinkForInstance<MarkerConfig>('marker', this.paraview.paraState.config, `threshold-${i}`);
          if (config.isChangeThresholdHighlightColor) {
            this.group('thresholds')!.append(rect);
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