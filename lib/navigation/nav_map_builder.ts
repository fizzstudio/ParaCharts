
import { Datapoint, Model, Series } from '@fizz/paramodel';
import { NavLevel, NavSchema, navSchemas } from '.';
import { DatapointNavNodeType, NavLayer, NavNode, type NavMap } from '../view/layers';
import { ChartType } from '@fizz/chartsignal-internal';
import { Direction, PlaneDirection } from '../config/config_types';
import { ParaState } from '../state';
import { clusterObject } from '@fizz/clustering';
import { mapn } from '@fizz/chart-classifier-utils';

export interface NavMapBuilderContext {
  get type(): ChartType;
  seriesInNavOrder(): Series[];
  get model(): Model | null;
  get paraState(): ParaState;
  get navDatapointType(): DatapointNavNodeType;
  get clustering(): clusterObject[] | null | undefined;
}

export function navSchema(ctx: NavMapBuilderContext): NavSchema {
  return navSchemas[ctx.type]![ctx.model!.multi ? 'multi' : 'single'];
}

export function populateNavMap(navMap: NavMap, ctx: NavMapBuilderContext) {
  const schema = navSchema(ctx);
  navMap.setOptions({
    shouldWrapMove: schema.shouldWrapMove
  });
  const nodes: Map<string, NavNode> = new Map();
  for (const level of schema.levels) {
    if (level.id === 'collective') {
      _createCollectiveLayer(navMap, ctx, nodes);
    } else if (level.id === 'series') {
      _createSeriesLayer(level, navMap, ctx, nodes);
    } else if (level.id === 'each-series-datapoints') {
      _createSeriesDatapointLayers(navMap, ctx, nodes);
    } else if (level.id === 'stacks') {
      _createStackLayer(navMap, ctx, nodes);
    } else if (level.id === 'each-stack-datapoints') {
      _createStackDatapointLayers(level, navMap, ctx, nodes);
    } else if (level.id === 'datapoints') {
      _createDatapointLayer(level, navMap, ctx, nodes);
    } else if (level.id === 'sequences') {
      _createSequenceLayer(navMap, ctx, nodes);
    } else if (level.id === 'candlesticks') {
      _createCandlestickLayer(navMap, ctx, nodes);
    } else if (level.id === 'clusters') {
      _createClusterLayer(navMap, ctx, nodes);
    } else if (level.id === 'each-cluster-datapoints') {
      _createClusterDatapointLayers(navMap, ctx, nodes);
    }
  }
  for (const transition of schema.transitions) {
    let outer: any[] = [];
    let innerFn: (s: any, i?: number) => any;
    if (transition.iter === 'datapoints') {
      outer = ctx.seriesInNavOrder();
      innerFn = (s: Series) => s.datapoints;
    } else if (transition.iter === 'records') {
      outer = ctx.model!.series[0].datapoints;
      innerFn = (d: Datapoint) => ctx.model!.series;
    } else if (transition.iter === 'clusters') {
      outer = ctx.clustering!.toSorted((a, b) => a.centroid[0] - b.centroid[0]);
      innerFn = (c: clusterObject) => c.dataPointIDs;
    } else if (transition.iter === 'record-datapoints') {
      outer = ctx.model!.series[0].datapoints;
      innerFn = (d: Datapoint, i: number) => ctx.model!.series.map(series => series.datapoints[i])
    }

    if (transition.source !== 'multi') {
      // Connect `in` from a single node to the first node of `transition.to`.
      nodes.get(transition.from)!.connect('in', nodes.get(`${transition.to}-0`)!);
      if (transition.dir) {
        transition.dir.split(/ /).forEach((d: PlaneDirection) => {
          nodes.get(transition.from)!.connect(d, nodes.get(`${transition.to}-0`)!);
        });
      }
    } else if (transition.target === 'containing') {
      const analysis = ctx.paraState.seriesAnalyses[ctx.model!.seriesKeys[0]]!;
      if (ctx.model!.multi) {
        ctx.seriesInNavOrder().forEach((series, i) => {
          const datapointLayer = navMap.layer('datapoints', i)!;
          const datapointNodes = datapointLayer.query('datapoint');
          analysis.sequences.forEach((seqInfo, j) => {
            datapointNodes.slice(seqInfo.start, seqInfo.end).forEach((datapointNode) => {
              datapointNode.connect('in', nodes.get(`sequences-${i}-${j}`)!);
            });
          });
        });
      } else {
        const datapointLayer = navMap.layer('datapoints', 0)!;
        const datapointNodes = datapointLayer.query('datapoint');
        analysis.sequences.forEach((seqInfo, i) => {
          datapointNodes.slice(seqInfo.start, seqInfo.end).forEach((datapointNode) => {
            datapointNode.connect('in', nodes.get(`sequences-${i}`)!);
          });
        });
      }
    } else if (transition.target === 'first') {
      // Connect `in` from each node N of a collection (e.g., a stack node)
      // to the first node of a collection corresponding to N (e.g., a layer of datapoints),
      // and connect `out` from the remaining corresponding nodes to N
      outer.forEach((a, i) => {
        const inner = innerFn(a);
        inner.forEach((b: any, j: number) => {
          if (j === 0) {
            nodes.get(`${transition.from}-${i}`)!.connect(
              'in', nodes.get(`${transition.to}-${i}-${j}`)!);
          } else {
            nodes.get(`${transition.to}-${i}-${j}`)!.connect(
              'out', nodes.get(`${transition.from}-${i}`)!, false);
          }
        });
        if (transition.dir) {
          transition.dir.split(/ /).forEach((d: Direction) => {
            nodes.get(`${transition.from}-${i}`)!.connect(
              d, nodes.get(`${transition.to}-${i}-0`)!);
          });
        }
      });
    } else if (transition.target === 'next') {
      const origInnerFn = innerFn!;
      if (transition.when === 'last') {
        innerFn = (s: Series) => [origInnerFn(s).at(-1)];
      }
      outer.forEach((a, i) => {
        const inner = innerFn(a);
        inner.forEach((b: Datapoint, j: number) => {
          const from = nodes.get(`${transition.from}-${i}-${b.datapointIndex}`);
          const to = nodes.get(`${transition.to}-${i + 1}`);
          if (to) {
            from!.connect('in', to);
            if (transition.dir) {
              transition.dir.split(/ /).forEach((d: PlaneDirection) => {
                from!.connect(d, to);
              });
            }
          }
        });
      });
    } else if (transition.target === 'equal') {
      outer.forEach((a, i) => {
        const when = (transition.when === 'first') ? i === 0 : false;
        if (when) {
          const inner = innerFn(a, i);
          inner.forEach((b: any, j: number) => {
            const from = nodes.get(`${transition.from}-${i}-${j}`);
            const to = nodes.get(`${transition.to}-${j}`);
            transition.dir!.split(/ /).forEach((d: PlaneDirection) => {
              from!.connect(d, to!);
            });
          });
        }
      });
    }
  }
  const startNodes = navMap.layer(schema.start, 0)!.nodes;
  const startNode = startNodes[0];
  const top = navMap.top.cursor!;
  top.connect('in', startNode);
  top.connect('left', startNode, false);
  top.connect('right', startNode, !schema.oneWayTopLink);
  top.connect('up', startNode, false);
  top.connect('down', startNode, false);
  startNodes.forEach(node => {
    node.connect('out', top, false);
  });
}

function _createCollectiveLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const collectiveLayer = navMap.newLayer('collective');
  nodes.set('collective', collectiveLayer.newNode('collective', {}));
}

function _createSeriesLayer(
  level: NavLevel,
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const seriesLayer = navMap.newLayer('series');
  const sortedSeries = ctx.seriesInNavOrder();
  let prevSeriesLanding: NavNode<'series'> | null = null;
  sortedSeries.forEach((series, i) => {
    const seriesLanding = seriesLayer.newNode(
      'series',
      {
        seriesKey: series.key,
      });
    nodes.set(`series-${i}`, seriesLanding);
    if (prevSeriesLanding) {
      seriesLanding.connect(level.orientation === 'horiz' ? 'left' : 'up', prevSeriesLanding);
    }
    prevSeriesLanding = seriesLanding;
  });
}

function _createSeriesDatapointLayers(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const sortedSeries = ctx.seriesInNavOrder();
  sortedSeries.forEach((series, i) => {
    const datapointLayer = navMap.newLayer('datapoints');
    let prevDatapointNode: NavNode<'datapoint'> | null = null;
    series.datapoints.forEach((datapoint, j) => {
      const datapointNode = datapointLayer.newNode(
        'datapoint',
        {
          seriesKey: series.key,
          index: j
        });
      nodes.set(`each-series-datapoints-${i}-${j}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('left', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}

function _createStackLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const stackLayer = navMap.newLayer('stack');
  ctx.model!.series[0].datapoints.forEach((datapoint, i) => {
    const stackNode = stackLayer.newNode(
      'stack',
      {
        index: datapoint.datapointIndex
      });
    nodes.set(`stacks-${i}`, stackNode);
  });
  // Link stack nodes
  stackLayer.query('stack').slice(0, -1).forEach((node, i) => {
    node.connect('right', stackLayer.nodes[i + 1]);
    node.connect('down', stackLayer.nodes[i + 1]);
  });
}

function _createStackDatapointLayers(
  level: NavLevel,
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  ctx.model!.series[0].datapoints.forEach((datapoint, i) => {
    const datapointLayer = navMap.newLayer('datapoint', level.orientation);
    let prevDatapointNode: NavNode<'datapoint'> | null = null;
    const stackDatapoints = ctx.model!.series.map(series => series.datapoints[i]);
    stackDatapoints.forEach((datapoint, j) => {
      const datapointNode = datapointLayer.newNode(
        'datapoint',
        {
          seriesKey: ctx.model!.series[j].key,
          index: i
        });
      nodes.set(`each-stack-datapoints-${i}-${j}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('up', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}

function _createDatapointLayer(
  level: NavLevel,
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const datapointLayer = navMap.newLayer('datapoints');
  let prevDatapointNode: NavNode<'datapoint'> | null = null;
  const datapoints = ctx.model!.series[0].datapoints;
  const datapointNodes = datapoints.map((datapoint, i) => {
    const datapointNode = datapointLayer.newNode(
      'datapoint',
      {
        seriesKey: ctx.model!.series[0].key,
        index: i
      });
    nodes.set(`datapoints-${i}`, datapointNode);
    if (prevDatapointNode) {
      datapointNode.connect('left', prevDatapointNode);
    }
    prevDatapointNode = datapointNode;
    return datapointNode;
  });
  if (level.wrap) {
    datapointNodes.at(-1)!.connect('right', datapointNodes[0]);
  }
}

function _createSequenceLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  if (ctx.model!.series.length === 1) {
    _createSingleSeriesSequenceLayer(
      navMap, ctx, nodes,
    );
  } else {
    _createMultiSeriesSequenceLayer(
      navMap, ctx, nodes,
    );
  }
}

function _createSingleSeriesSequenceLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const seqLayer = navMap.newLayer('sequences');
  const analysis = ctx.paraState.seriesAnalyses[ctx.model!.seriesKeys[0]]!;
  const seqNodes: NavNode<'sequence'>[] = analysis.sequences.map((seq, i) => {
    const seqNode = seqLayer.newNode(
      'sequence',
      {
        seriesKey: ctx.model!.seriesKeys[0],
        start: seq.start,
        end: seq.end
      });
    nodes.set(`sequences-${i}`, seqNode);
    return seqNode;
  });
  seqNodes.slice(0, -1).forEach((seqNode, i) => {
    seqNode.connect('right', seqNodes[i + 1]);
  });
}

function _createMultiSeriesSequenceLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  ctx.seriesInNavOrder().forEach((series, i) => {
    const seqLayer = navMap.newLayer('sequences');
    const analysis = ctx.paraState.seriesAnalyses[series.key]!;
    const seqNodes: NavNode<'sequence'>[] = [];
    analysis.sequences.forEach((seq, j) => {
      const seqNode = seqLayer.newNode(
        'sequence',
        {
          seriesKey: series.key,
          start: seq.start,
          end: seq.end
        });
      nodes.set(`sequences-${i}-${j}`, seqNode);
      seqNodes.push(seqNode);
    });
    seqNodes.slice(0, -1).forEach((seqNode, j) => {
      seqNode.connect('right', seqNodes[j + 1]);
    });
  });
}

function _createCandlestickLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const candlesticksLayer = navMap.newLayer('candlesticks');
  // Sort by value of first datapoint from greatest to least
  const sortedSeries = ctx.seriesInNavOrder();
  let prevCandlestickNode: NavNode | null = null;
  sortedSeries[0].datapoints.forEach((_datapoint, i) => {
    const candlestickNode = candlesticksLayer.newNode(
      'candlestick',
      {
        index: i
      });
    if (prevCandlestickNode) {
      candlestickNode.connect('left', prevCandlestickNode);
      candlestickNode.connect('up', prevCandlestickNode);
    }
    prevCandlestickNode = candlestickNode;
    const detailsLayer = navMap.newLayer('details', 'vert');
    let prevNode: NavNode | null = null;
    ['open', 'high', 'low', 'close'].forEach((seriesKey, j) => {
      const node = detailsLayer.newNode(
        'datapoint',
        {
          seriesKey,
          index: i
        });
        if (prevNode) {
          node.connect('down', prevNode);
        }
        prevNode = node;
    });
    candlestickNode.connect('in', detailsLayer.nodes[0]);
    detailsLayer.nodes[1].connect('out', candlestickNode);
    detailsLayer.nodes[2].connect('out', candlestickNode);
    detailsLayer.nodes[3].connect('out', candlestickNode);
  });
}

function _createClusterLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  if (ctx.model!.series.length === 1) {
    _createSingleSeriesClusterLayer(
      navMap, ctx, nodes,
    );
  } else {
    _createMultiSeriesClusterLayer(
      navMap, ctx, nodes,
    );
  }
}

function _createSingleSeriesClusterLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const clusterLayer = navMap.newLayer('clusters');
  const clusterLandings: NavNode<'cluster'>[] = [];
  const clustering = ctx.clustering!.toSorted((a, b) => a.centroid[0] - b.centroid[0]);
  clustering.forEach((cluster, clusterIndex) => {
    const clusterLanding = clusterLayer.newNode(
      'cluster',
      {
        seriesKey: ctx.model!.seriesKeys[0],
        start: 0,
        end: cluster.dataPointIDs.length - 1,
        datapoints: [...cluster.dataPointIDs, ...cluster.outlierIDs].map(id => ctx.paraState.model?.allPoints[id]).filter(p => p != undefined),
        clustering: cluster,
        index: clusterIndex
      });
    nodes.set(`clusters-${clusterIndex}`, clusterLanding);
    clusterLandings.push(clusterLanding);
  });
  clusterLandings.slice(0, -1).forEach((clusterNode, i) => {
    clusterNode.connect('right', clusterLandings[i + 1]);
  });
}

function _createMultiSeriesClusterLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const seriesLayer = navMap.newLayer('clusters');
  const sortedSeries = ctx.seriesInNavOrder();
  let prevClusterLanding: NavNode | null = null;
  sortedSeries.forEach((series, i) => {
    const clusterIndex = ctx.clustering!.findIndex(c => c.label === series.key);
    const cluster = ctx.clustering![clusterIndex];
    const clusterLanding = seriesLayer.newNode('cluster',
      {
        seriesKey: series.key,
        start: 0,
        end: cluster.dataPointIDs.length - 1,
        datapoints: [...cluster.dataPointIDs, ...cluster.outlierIDs].map(id => ctx.paraState.model?.allPoints[id]).filter(p => p != undefined),
        clustering: cluster,
        index: clusterIndex
      });
    nodes.set(`clusters-${i}`, clusterLanding);
    if (prevClusterLanding) {
      clusterLanding.connect('left', prevClusterLanding);
    }
    prevClusterLanding = clusterLanding;
  });
}

function _createClusterDatapointLayers(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  if (ctx.model!.series.length === 1) {
    _createSingleSeriesClusterDatapointLayers(
      navMap, ctx, nodes,
    );
  } else {
    _createMultiSeriesClusterDatapointLayers(
      navMap, ctx, nodes,
    );
  }
}

function _createSingleSeriesClusterDatapointLayers(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const clustering = ctx.clustering!.toSorted((a, b) => a.centroid[0] - b.centroid[0]);
  clustering.forEach((cluster, clusterIndex) => {
    const datapointLayer = navMap.newLayer('datapoint');
    let prevDatapointNode: NavNode | null = null;
    cluster.dataPointIDs.forEach((dpId, dpIndex) => {
      const datapointNode = datapointLayer.newNode(
        ctx.navDatapointType,
        {
          seriesKey: ctx.model!.seriesKeys[0],
          index: dpId,
          cluster: ctx.clustering!.indexOf(cluster)
        });
      nodes.set(`each-cluster-datapoints-${clusterIndex}-${dpIndex}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('left', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}

function _createMultiSeriesClusterDatapointLayers(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const sortedSeries = ctx.seriesInNavOrder();
  sortedSeries.forEach((series, i) => {
    const clusterIndex = ctx.clustering!.findIndex(c => c.label === series.key);
    const cluster = ctx.clustering![clusterIndex];
    const datapointLayer = navMap.newLayer('datapoint');
    let prevDatapointNode: NavNode | null = null;
    cluster.dataPointIDs.forEach((dpId, j) => {
      const datapointNode = datapointLayer.newNode(
        ctx.navDatapointType,
        {
          seriesKey: series.key,
          index: j,
          cluster: clusterIndex
        });
      nodes.set(`each-cluster-datapoints-${clusterIndex}-${j}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('left', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}
