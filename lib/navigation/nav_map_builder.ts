
import { Datapoint, Model, Series, clusterObject } from '@fizz/chartsignal-internal';
import { NavIter, NavSchemaLayer, NavSchema, navSchemas, NavSchemaTransition } from '.';
import { DatapointNavNodeType, NavLayer, NavNode, NavNodeType, type NavMap } from '../view/layers';
import { ChartType } from '@fizz/chartsignal-internal';
import { Direction, PlaneDirection } from '../config/config_types';
import { ParaState } from '../state';

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
  for (const level of schema.layers) {
    if (level.id === 'collective') {
      _createCollectiveLayer(navMap, ctx, nodes);
    } else if (level.id === 'series') {
      _createSeriesLayer(level, navMap, ctx, nodes);
    } else if (level.id === 'eachSeriesDatapoints') {
      _createSeriesDatapointLayers(navMap, ctx, nodes);
    } else if (level.id === 'stacks') {
      _createStackLayer(navMap, ctx, nodes);
    } else if (level.id === 'chords') {
      _createStackLayer(navMap, ctx, nodes, 'chord');
    } else if (level.id === 'eachStackDatapoints') {
      _createStackDatapointLayers(level, navMap, ctx, nodes);
    } else if (level.id === 'datapoints') {
      _createDatapointLayer(level, navMap, ctx, nodes);
    } else if (level.id === 'sequences') {
      _createSequenceLayer(navMap, ctx, nodes);
    } else if (level.id === 'candlesticks') {
      _createCandlestickLayer(navMap, ctx, nodes);
    } else if (level.id === 'clusters') {
      _createClusterLayer(navMap, ctx, nodes);
    } else if (level.id === 'eachClusterDatapoints') {
      _createClusterDatapointLayers(navMap, ctx, nodes);
    }
  }
  const fromIter: Record<string, NavIter> = {
    series: 'datapoints',
    eachSeriesDatapoints: 'datapoints',
    chords: 'records',
    stacks: 'records',
    eachStackDatapoints: 'recordDatapoints',
    clusters: 'clusters'
  };
  for (const transition of schema.transitions) {
    if (transition.mode === 'firstToFirst') {
      // Connect from the first node of `from` to the first node of `to`.
      const from = navMap.layer(transition.from, 0)!.nodes[0];
      const to = navMap.layer(transition.to, 0)!.nodes[0];
      _dirs(transition).forEach((d: Direction) => {
        from!.connect(d, to!);
      });
    } else if (transition.mode === 'eachToFirst') {
      // Connect each node of `from` to the first node of `to`.
      const fromLayer = navMap.layer(transition.from, 0)!;
      const toLayer = navMap.layer(transition.to, 0)!;
      fromLayer.nodes.forEach((from, i) => {
        _dirs(transition).forEach((d: Direction) => {
          from!.connect(d, toLayer.nodes[0], !!transition.reciprocal);
        });
      });
    } else if (transition.mode === 'trendPointToTrend') {
      // Connect each node of `from` to its corresponding trend.
      if (ctx.model!.multi) {
        ctx.seriesInNavOrder().forEach((series, i) => {
          const fromLayer = navMap.layer(transition.from, i)!;
          const fromNodes = fromLayer.query('datapoint');
          const toLayer = navMap.layer(transition.to, i);
          const analysis = ctx.paraState.seriesAnalyses[series.key]!;
          analysis.sequences.forEach((seqInfo, j) => {
            const to = toLayer!.nodes[j];
            fromNodes.slice(seqInfo.start, seqInfo.end).forEach((from) => {
              _dirs(transition).forEach((d: Direction) => {
                from.connect(d, to);
              });
            });
          });
        });
      } else {
        const fromLayer = navMap.layer(transition.from, 0)!;
        const fromNodes = fromLayer.query('datapoint');
        const toLayer = navMap.layer(transition.to, 0);
        const analysis = ctx.paraState.seriesAnalyses[ctx.model!.seriesKeys[0]]!;
        analysis.sequences.forEach((seqInfo, i) => {
          const to = toLayer!.nodes[i];
          fromNodes.slice(seqInfo.start, seqInfo.end).forEach((from) => {
            _dirs(transition).forEach((d: Direction) => {
              from.connect(d, to);
            });
          });
        });
      }
    } else if (transition.mode === 'eachToFirstOfRelated') {
      // Connect from each node N of a layer (e.g., a stack node)
      // to the first node of a layer corresponding to N (e.g., a layer of datapoints),
      // and connect `out` from the remaining corresponding nodes to N
      const fromLayer = navMap.layer(transition.from, 0);
      fromLayer!.nodes.forEach((from, i) => {
        const toLayer = navMap.layer(transition.to, i);
        toLayer!.nodes.forEach((to, j) => {
          if (j === 0) {
            _dirs(transition).forEach((d: Direction) => {
              from!.connect(d, to!);
            });
          } else {
            to.connect('out', from, false);
          }
        });
      });
    } else if (transition.mode === 'eachOfRelatedToNext') {
      // Connect all members of each `from` layer to the next corresponding `to` node in sequence.
      const toLayer = navMap.layer(transition.to, 0);
      navMap.allLayers(transition.from).forEach((fromLayer, i) => {
        const to = toLayer!.nodes[i + 1];
        if (to) {
          for (let j = 0; j < fromLayer!.nodes.length; j++) {
            if (transition.when === 'last' && j < fromLayer!.nodes.length - 1) continue;
            const from = fromLayer.nodes[j];
            _dirs(transition).forEach((d: Direction) => {
              from.connect(d, to);
            });
          }
        }
      });
    } else if (transition.mode === 'eachOfRelatedToSame') {
      // Connect all members of each `from` layer to the corresponding `to` node.
      const toLayer = navMap.layer(transition.to, 0);
      for (let i = 0; i < navMap.allLayers(transition.from).length; i++) {
        const fromLayer = navMap.layer(transition.from, i);
        if (transition.when === 'first' && i > 0) continue;
        for (let j = 0; j < fromLayer!.nodes.length; j++) {
          const from = fromLayer!.nodes[j];
          const to = toLayer!.nodes[j];
          _dirs(transition).forEach((d: Direction) => {
            from.connect(d, to);
          });
        }
      }
    }
  }
  let startNodes: readonly NavNode[];
  if (schema.start.if === 'sonificationIsEnabled') {
    if (!schema.start.else) throw new Error('missing `start.else`');
    if (ctx.paraState.config.sonification.isSonificationEnabled) {
      startNodes = navMap.layer(schema.start.layer, 0)!.nodes;
    } else {
      startNodes = navMap.layer(schema.start.else, 0)!.nodes;
    }
  } else {
    startNodes = navMap.layer(schema.start.layer, 0)!.nodes;
  }
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

function _dirs(transition: NavSchemaTransition): Direction[] {
  return Array.from(new Set<Direction>(
    (transition.dir ?? 'in').trim().split(/ /) as Direction[]));
}

function _createCollectiveLayer(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const collectiveLayer = navMap.newLayer('collective');
  nodes.set('collective-0', collectiveLayer.newNode('collective', {}));
}

/**
 * Create landings for each series and connect them together.
 */
function _createSeriesLayer(
  level: NavSchemaLayer,
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

/**
 * Create layers for the datapoints of each series, and
 * populate them with datapoint nodes.
 */
function _createSeriesDatapointLayers(
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  const sortedSeries = ctx.seriesInNavOrder();
  sortedSeries.forEach((series, i) => {
    const datapointLayer = navMap.newLayer('eachSeriesDatapoints');
    let prevDatapointNode: NavNode<'datapoint'> | null = null;
    series.datapoints.forEach((datapoint, j) => {
      const datapointNode = datapointLayer.newNode(
        'datapoint',
        {
          seriesKey: series.key,
          index: j
        });
      nodes.set(`eachSeriesDatapoints-${i}-${j}`, datapointNode);
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
  type: NavNodeType = 'stack'
) {
  const stackLayer = navMap.newLayer(type + 's');
  ctx.model!.series[0].datapoints.forEach((datapoint, i) => {
    const stackNode = stackLayer.newNode(
      type,
      {
        index: datapoint.datapointIndex
        // Make the first chord node invisible
      }, (type === 'chord') ? (i === 0) : false);
    nodes.set(`${type}s-${i}`, stackNode);
  });
  // Link stack nodes
  stackLayer.query(type).slice(0, -1).forEach((node, i) => {
    node.connect('right', stackLayer.nodes[i + 1]);
    node.connect('down', stackLayer.nodes[i + 1]);
  });
}

function _createStackDatapointLayers(
  level: NavSchemaLayer,
  navMap: NavMap,
  ctx: NavMapBuilderContext,
  nodes: Map<string, NavNode>,
) {
  ctx.model!.series[0].datapoints.forEach((datapoint, i) => {
    const datapointLayer = navMap.newLayer('eachStackDatapoints', level.orientation);
    let prevDatapointNode: NavNode<'datapoint'> | null = null;
    const stackDatapoints = ctx.model!.series.map(series => series.datapoints[i]);
    stackDatapoints.forEach((datapoint, j) => {
      const datapointNode = datapointLayer.newNode(
        'datapoint',
        {
          seriesKey: ctx.model!.series[j].key,
          index: i
        });
      nodes.set(`eachStackDatapoints-${i}-${j}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('up', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}

function _createDatapointLayer(
  level: NavSchemaLayer,
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
        datapoints: [...cluster.dataPointIDs].map(id => ctx.paraState.model?.allPoints[id]).filter(p => p != undefined),
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
        datapoints: [...cluster.dataPointIDs].map(id => ctx.paraState.model?.allPoints[id]).filter(p => p != undefined),
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
    const datapointLayer = navMap.newLayer('eachClusterDatapoints');
    let prevDatapointNode: NavNode | null = null;
    cluster.dataPointIDs.forEach((dpId, dpIndex) => {
      const datapointNode = datapointLayer.newNode(
        ctx.navDatapointType,
        {
          seriesKey: ctx.model!.seriesKeys[0],
          index: dpId,
          cluster: ctx.clustering!.indexOf(cluster)
        });
      nodes.set(`eachClusterDatapoints-${clusterIndex}-${dpIndex}`, datapointNode);
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
    const datapointLayer = navMap.newLayer('eachClusterDatapoints');
    let prevDatapointNode: NavNode | null = null;
    cluster.dataPointIDs.forEach((dpId, j) => {
      const datapointNode = datapointLayer.newNode(
        ctx.navDatapointType,
        {
          seriesKey: series.key,
          index: j,
          cluster: clusterIndex
        });
      nodes.set(`eachClusterDatapoints-${clusterIndex}-${j}`, datapointNode);
      if (prevDatapointNode) {
        datapointNode.connect('left', prevDatapointNode);
      }
      prevDatapointNode = datapointNode;
    });
  });
}
