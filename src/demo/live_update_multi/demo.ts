import '../../../lib-ai/index-ai';

import { ParaChartAi } from '../../../lib-ai/index-ai';

const MANI = '/src/demo/live_update_multi/line-multi-manifest-261.json';
const MIN = 2;
const MAX = 8;
const RANGE = MAX - MIN;
const AUTO_INTERVAL_MS = 500;

let mani: any;
let url: string;
let interval: ReturnType<typeof setInterval> | null =  null;

const addBtn = document.getElementById('add-btn')!;
const startBtn = document.getElementById('start-btn')!;
const resetBtn = document.getElementById('reset-btn')!;
const maniText = document.getElementById('manifest')!;

const chart = document.getElementById('chart') as ParaChartAi;

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
  }, AUTO_INTERVAL_MS);
});
resetBtn.addEventListener('click', () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  reset();
});

async function addRecord() {
  // mani.jim.datasets[0].series[0].records[0].x
  const data1 = mani.jim.datasets[0].series[0].records;
  const data2 = mani.jim.datasets[0].series[1].records;
  data1.splice(0, 1);
  let prevY = parseFloat(data1.at(-1)!.y);
  let pctDelta = Math.random()*0.15 - 0.08;
  data1.push({
    x: nextX(data1.at(-1)!.x),
    y: `${Math.abs(prevY + pctDelta*RANGE)}`
  });
  data2.splice(0, 1);
  prevY = parseFloat(data2.at(-1)!.y);
  pctDelta = Math.random()*0.15 - 0.06;
  data2.push({
    x: nextX(data2.at(-1)!.x),
    y: `${Math.abs(prevY + pctDelta*RANGE)}`
  });
  await updateChart();
}

function nextX(x: string) {
  const y = parseInt(x) + 1;
  return `${y + 1}`;
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