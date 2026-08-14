import '../../../lib-ai/index-ai';

import { ParaChartAi } from '../../../lib-ai/index-ai';

const MANI = '/src/demo/live_update_multi/line-multi-manifest-261.json';
const MIN = 2;
const MAX = 8;
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
  const data1 = chart.paraState.manifest!.jim.datasets[0].series[0].records!;
  const data2 = chart.paraState.manifest!.jim.datasets[0].series[1].records!;
  const prevY1 = parseFloat(data1.at(-1)!.y);
  const pctDelta1 = Math.random()*0.15 - 0.08;
  const prevY2 = parseFloat(data2.at(-1)!.y);
  const pctDelta2 = Math.random()*0.15 - 0.06;
  await chart.api.addRecord({
    Expenses: {
      x: nextX(data1.at(-1)!.x),
      y: `${Math.abs(prevY1 + pctDelta1*RANGE)}`
    },
    Revenue: {
      x: nextX(data2.at(-1)!.x),
      y: `${Math.abs(prevY2 + pctDelta2*RANGE)}`
    }
  });
  const maniStr = JSON.stringify(chart.paraState.manifest, null, 2);
  maniText.textContent = maniStr;
}

// function nextX(x: string) {
//   const y = parseInt(x) + 1;
//   return `${y + 1}`;
// }

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

// await reset();

const maniStr = JSON.stringify(chart.paraState.manifest, null, 2);
maniText.textContent = maniStr;
