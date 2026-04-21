import '../../../lib-ai/index-ai';

import { ParaChartAi } from '../../../lib-ai/index-ai';
import { PlaneChartInfo } from '../../../lib/chart_types';

const MANI = '/src/demo/live_update/line-single-manifest-1047.json';
const MIN = 35;
const MAX = 65;
const RANGE = MAX - MIN;

let autoIntervalMs = 500;

let mani: any;
let url: string;
let interval: ReturnType<typeof setInterval> | null =  null;

const addBtn = document.getElementById('add-btn')!;
const startBtn = document.getElementById('start-btn')!;
const resetBtn = document.getElementById('reset-btn')!;
const maniText = document.getElementById('manifest')!;
const delayInput = document.getElementById('delay-input') as HTMLInputElement;

const chart = document.getElementById('chart') as ParaChartAi;

delayInput.value = `${autoIntervalMs}`;

addBtn.addEventListener('click', () => {
  if (interval) return;
  addRecord();
});
startBtn.addEventListener('click', () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
    return;
  }
  interval = setInterval(async () => {
    await addRecord();
  }, autoIntervalMs);
});
resetBtn.addEventListener('click', () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  reset();
});
delayInput.addEventListener('change', () => {
  console.log(delayInput.value);
  autoIntervalMs = parseInt(delayInput.value);
  if (interval) {
    clearInterval(interval);
    interval = setInterval(async () => {
      await addRecord();
    }, autoIntervalMs);
  }
});

async function addRecord() {
  // mani.jim.datasets[0].series[0].records[0].x
  const data = mani.jim.datasets[0].series[0].records;
  data.splice(0, 1);
  const prevY = parseFloat(data.at(-1)!.y);
  const pctDelta = Math.random()*0.3 - 0.15;
  // const yInterval = (chart.paraState.chartInfo as PlaneChartInfo).yInterval!;
  // const yRange = yInterval.end - yInterval.start;
  data.push({
    x: nextX(data.at(-1)!.x),
    y: `${prevY + pctDelta*RANGE}`
  });
  await updateChart();
}

function nextX(x: string) {
  let [q, y] = x.split(' ');
  const qnum = (parseInt(q[1]) - 1 + 1) % 4;
  q = `Q${qnum + 1}`;
  if (!qnum) {
      y = `${parseInt(y) + 1}`;
  }
  return q + ' ' + y;
}

async function reset() {
  mani = await (await fetch(MANI)).json();
  await updateChart();
}

async function updateChart() {
  const maniStr = JSON.stringify(mani, null, 2);
  maniText.textContent = maniStr;
  const blob = new Blob([maniStr], {
    type: 'application/json',
  });
  if (url) {
    URL.revokeObjectURL(url);
  }
  url = URL.createObjectURL(blob);
  chart.api.setManifest(url);
  await chart.loaded;
}

await chart.loaded;

await reset();