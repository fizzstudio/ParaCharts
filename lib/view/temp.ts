/* From Model

format(box: Box<Scalar>, context: FormatContext) {
  const settingVal = context === 'domId' 
    ? 'domId' 
    : this.ctrlr.settingStore.get(formatContextSettings[context]);
  if (settingVal === 'raw') {
    return (box.raw ?? box.value).toString();
  } else if (settingVal === 'domId') {
    return utils.strToId((box.raw ?? box.value).toString());
  } else {
    return box.value.toString();
  }
}

  formatX(context: FormatContext) {
    return this.model.format(this.x, context);
  }

  formatY(context: FormatContext) {
    return this.model.format(this.y, context);
  }

  format(context: FormatContext) {
    return `${this.formatX(context)}, ${this.formatY(context)}`;
  }

*/

/** 
 * Context where a particular value appears. 
 * @public
 */
export type FormatContext = keyof typeof formatContextSettings;
// Settings that control the format for each context
const formatContextSettings = {
  xTick: 'axis.x.tick.labelFormat',
  yTick: 'axis.y.tick.labelFormat',
  linePoint: 'type.line.pointLabelFormat',
  scatterPoint: 'type.scatter.pointLabelFormat',
  barCluster: 'type.bar.clusterLabelFormat',
  pieChunk: 'type.pie.chunkLabelFormat',
  donutChunk: 'type.donut.chunkLabelFormat',
  gaugeChunk: 'type.gauge.chunkLabelFormat',
  steplinePoint: 'type.stepline.pointLabelFormat',
  lollipopPoint: 'type.lollipop.pointLabelFormat',
  lollipopCluster: 'type.lollipop.clusterLabelFormat',
  jimX: 'jim.xValueFormat',
  dataTableX: 'dataTable.xValueFormat',
  dataTableY: 'dataTable.yValueFormat',
  statusBar: 'statusBar.valueFormat',
  domId: 'NA'
};