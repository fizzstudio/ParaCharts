/* ParaCharts: Setting Ranges
Copyright (C) 2025 Fizz Studio

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

/**
 * Range constraints for an integer setting.
 * @public
 */
export interface IntRange {
  /** Minimum allowed value (inclusive) */
  min?: number;
  /** Maximum allowed value (inclusive) */
  max?: number;
  /** Integer type discriminator */
  type: 'int';
}

/**
 * Range constraints for a floating-point setting.
 * Supports open intervals for values that cannot equal the boundary.
 * @public
 */
export interface FloatRange {
  /** Minimum allowed value (inclusive) */
  min?: number;
  /** Maximum allowed value (inclusive) */
  max?: number;
  /** Minimum allowed value (exclusive) - value must be > minOpen */
  minOpen?: number;
  /** Maximum allowed value (exclusive) - value must be < maxOpen */
  maxOpen?: number;
  /** Floating-point type discriminator */
  type: 'float';
}

/**
 * Defines valid numeric ranges for settings.
 * @public
 */
export type NumericRange = IntRange | FloatRange;

/**
 * Maps setting paths to their valid numeric ranges.
 * Used for validation and documentation.
 * @public
 */
export const settingRanges: Record<string, NumericRange> = {
  // ============================================
  // UI Settings
  // ============================================
  'ui.speechRate': { min: 0.5, type: 'float' },
  'ui.focusRingGap': { min: 0, type: 'int' },
  'ui.navRunTimeoutMs': { min: 0, type: 'int' },

  // ============================================
  // Animation Settings
  // ============================================
  'animation.animateRevealTimeMs': { min: 0, type: 'int' },
  'animation.popInAnimateRevealTimeMs': { min: 0, type: 'int' },
  'animation.animationOriginValue': { type: 'float' },

  // ============================================
  // Color Settings
  // ============================================
  'color.contrastLevel': { min: 0, max: 1, type: 'float' },

  // ============================================
  // Chart Settings
  // ============================================
  'chart.size.width': { min: 1, type: 'int' },
  'chart.size.height': { min: 1, type: 'int' },
  'chart.title.margin': { min: 0, type: 'int' },
  'chart.fontScale': { min: 0.5, type: 'float' },
  'chart.strokeWidth': { min: 0, type: 'float' },
  // Negative scale would mirror/flip; 0 means no highlight effect
  'chart.strokeHighlightScale': { min: 0, type: 'float' },
  'chart.symbolStrokeWidth': { min: 0, type: 'float' },
  // Negative scale would mirror/flip; 0 means no highlight effect
  'chart.symbolHighlightScale': { min: 0, type: 'float' },

  // ============================================
  // Axis Settings
  // ============================================
  'axis.minInterval': { min: 0, type: 'float' },
  'axis.datapointMargin': { min: 0, type: 'float' },

  // Horizontal axis
  'axis.horiz.title.gap': { min: 0, type: 'int' },
  'axis.horiz.ticks.padding': { min: 0, type: 'int' },
  'axis.horiz.ticks.opacity': { min: 0, max: 1, type: 'float' },
  'axis.horiz.ticks.strokeWidth': { min: 0, type: 'float' },
  'axis.horiz.ticks.length': { min: 0, type: 'int' },
  // step=0 causes NaN in modulo; step<0 causes wrong behavior
  'axis.horiz.ticks.step': { min: 1, type: 'int' },
  'axis.horiz.ticks.labels.angle': { min: -180, max: 180, type: 'int' },
  'axis.horiz.ticks.labels.offsetGap': { min: 0, type: 'int' },
  'axis.horiz.ticks.labels.gap': { min: 0, type: 'int' },
  'axis.horiz.line.strokeWidth': { min: 0, type: 'float' },

  // Vertical axis
  'axis.vert.title.gap': { min: 0, type: 'int' },
  'axis.vert.ticks.padding': { min: 0, type: 'int' },
  'axis.vert.ticks.opacity': { min: 0, max: 1, type: 'float' },
  'axis.vert.ticks.strokeWidth': { min: 0, type: 'float' },
  'axis.vert.ticks.length': { min: 0, type: 'int' },
  // step=0 causes NaN in modulo; step<0 causes wrong behavior
  'axis.vert.ticks.step': { min: 1, type: 'int' },
  'axis.vert.ticks.labels.angle': { min: -180, max: 180, type: 'int' },
  'axis.vert.ticks.labels.offsetGap': { min: 0, type: 'int' },
  'axis.vert.ticks.labels.gap': { min: 0, type: 'int' },
  'axis.vert.line.strokeWidth': { min: 0, type: 'float' },

  // ============================================
  // Legend Settings
  // ============================================
  'legend.boxStyle.outlineWidth': { min: 0, type: 'int' },
  'legend.padding': { min: 0, type: 'int' },
  'legend.symbolLabelGap': { min: 0, type: 'int' },
  'legend.pairGap': { min: 0, type: 'int' },
  'legend.margin': { min: 0, type: 'int' },

  // ============================================
  // Plot Area Settings
  // ============================================
  'plotArea.size.width': { type: 'int' },
  'plotArea.size.height': { type: 'int' },

  // ============================================
  // Popup Settings
  // ============================================
  'popup.opacity': { min: 0, max: 1, type: 'float' },
  'popup.leftPadding': { min: 0, type: 'int' },
  'popup.rightPadding': { min: 0, type: 'int' },
  'popup.upPadding': { min: 0, type: 'int' },
  'popup.downPadding': { min: 0, type: 'int' },
  'popup.margin': { min: 0, type: 'int' },
  'popup.maxWidth': { min: 0, type: 'int' },
  'popup.borderRadius': { min: 0, type: 'int' },

  // ============================================
  // Sonification Settings
  // ============================================
  // Note: hertzLower/hertzUpper are indices into the HERTZ array
  'sonification.hertzLower': { min: 0, type: 'int' },
  'sonification.hertzUpper': { min: 0, type: 'int' },
  'sonification.soniPlaySpeed': { type: 'float' },
  // Note: riffSpeedIndex is index into SONI_RIFF_SPEEDS array
  'sonification.riffSpeedIndex': { min: 0, type: 'int' },

  // ============================================
  // Bar Chart Settings
  // ============================================
  'type.bar.barWidth': { min: 0, type: 'float' },
  'type.bar.totalLabelGap': { min: 0, type: 'int' },
  'type.bar.stackLabelGap': { min: 0, type: 'int' },
  'type.bar.clusterGap': { min: 0, type: 'int' },
  'type.bar.barGap': { min: 0, type: 'float' },
  'type.bar.stackInsideGap': { min: 0, type: 'int' },
  'type.bar.lineWidth': { min: 0, type: 'float' },

  // ============================================
  // Column Chart Settings
  // ============================================
  'type.column.barWidth': { min: 0, type: 'float' },
  'type.column.totalLabelGap': { min: 0, type: 'int' },
  'type.column.stackLabelGap': { min: 0, type: 'int' },
  'type.column.clusterGap': { min: 0, type: 'int' },
  'type.column.barGap': { min: 0, type: 'float' },
  'type.column.stackInsideGap': { min: 0, type: 'int' },
  'type.column.lineWidth': { min: 0, type: 'float' },

  // ============================================
  // Line Chart Settings
  // ============================================
  'type.line.lineWidth': { min: 1, type: 'float' },
  'type.line.lineWidthMax': { type: 'float' },
  'type.line.lowVisionLineWidth': { type: 'float' },
  // Negative scale would mirror/flip; 0 means no highlight effect
  'type.line.lineHighlightScale': { min: 0, type: 'float' },
  'type.line.baseSymbolSize': { type: 'int' },
  'type.line.seriesLabelPadding': { min: 0, type: 'int' },
  'type.line.leaderLineLength': { min: 0, type: 'int' },

  // ============================================
  // Step Line Chart Settings
  // ============================================
  'type.stepline.lineWidth': { type: 'float' },
  'type.stepline.lineWidthMax': { type: 'float' },
  'type.stepline.baseSymbolSize': { type: 'int' },
  'type.stepline.seriesLabelPadding': { min: 0, type: 'int' },
  'type.stepline.leaderLineLength': { min: 0, type: 'int' },

  // ============================================
  // Lollipop Chart Settings
  // ============================================
  'type.lollipop.barWidth': { min: 0, type: 'float' },
  'type.lollipop.totalLabelGap': { min: 0, type: 'int' },
  'type.lollipop.stackLabelGap': { min: 0, type: 'int' },
  'type.lollipop.clusterGap': { min: 0, type: 'int' },
  'type.lollipop.barGap': { min: 0, type: 'float' },
  'type.lollipop.stackInsideGap': { min: 0, type: 'int' },
  'type.lollipop.lineWidth': { min: 0, type: 'float' },

  // ============================================
  // Waterfall Chart Settings
  // ============================================
  'type.waterfall.barWidth': { type: 'int' },
  'type.waterfall.barLabelGap': { min: 0, type: 'int' },
  'type.waterfall.barGap': { min: 0, type: 'int' },

  // ============================================
  // Histogram Settings
  // ============================================
  'type.histogram.bins': { min: 5, type: 'int' },

  // ============================================
  // Heatmap Settings
  // ============================================
  'type.heatmap.resolution': { type: 'int' },

  // ============================================
  // Pie Chart Settings
  // ============================================
  'type.pie.orientationAngleOffset': { type: 'int' },
  // At 0, inner radius = outer radius (nothing visible)
  'type.pie.annularThickness': { minOpen: 0, max: 1, type: 'float' },
  'type.pie.centerLabelPadding': { min: 0, type: 'int' },
  'type.pie.explodeDistance': { min: 0, type: 'int' },
  'type.pie.outsideLabels.vertGap': { min: 0, type: 'int' },
  'type.pie.outsideLabels.arcGap': { min: 0, type: 'int' },
  'type.pie.outsideLabels.horizShift': { min: 0, type: 'int' },
  'type.pie.outsideLabels.horizPadding': { min: 0, type: 'int' },
  'type.pie.outsideLabels.underlineGap': { min: 0, type: 'int' },
  'type.pie.insideLabels.position': { min: 0, max: 1, type: 'float' },

  // ============================================
  // Donut Chart Settings
  // ============================================
  'type.donut.orientationAngleOffset': { type: 'int' },
  // At 0, inner radius = outer radius (nothing visible)
  'type.donut.annularThickness': { minOpen: 0, max: 1, type: 'float' },
  'type.donut.centerLabelPadding': { min: 0, type: 'int' },
  'type.donut.explodeDistance': { min: 0, type: 'int' },
  'type.donut.outsideLabels.vertGap': { min: 0, type: 'int' },
  'type.donut.outsideLabels.arcGap': { min: 0, type: 'int' },
  'type.donut.outsideLabels.horizShift': { min: 0, type: 'int' },
  'type.donut.outsideLabels.horizPadding': { min: 0, type: 'int' },
  'type.donut.outsideLabels.underlineGap': { min: 0, type: 'int' },
  'type.donut.insideLabels.position': { min: 0, max: 1, type: 'float' },

  // ============================================
  // Gauge Chart Settings
  // ============================================
  'type.gauge.orientationAngleOffset': { type: 'int' },
  // At 0, inner radius = outer radius (nothing visible)
  'type.gauge.annularThickness': { minOpen: 0, max: 1, type: 'float' },
  'type.gauge.centerLabelPadding': { min: 0, type: 'int' },
  'type.gauge.explodeDistance': { min: 0, type: 'int' },
  'type.gauge.outsideLabels.vertGap': { min: 0, type: 'int' },
  'type.gauge.outsideLabels.arcGap': { min: 0, type: 'int' },
  'type.gauge.outsideLabels.horizShift': { min: 0, type: 'int' },
  'type.gauge.outsideLabels.horizPadding': { min: 0, type: 'int' },
  'type.gauge.outsideLabels.underlineGap': { min: 0, type: 'int' },
  'type.gauge.insideLabels.position': { min: 0, max: 1, type: 'float' },

  // ============================================
  // Venn Diagram Settings
  // ============================================
  'type.venn.orientationAngleOffset': { type: 'int' },
};
