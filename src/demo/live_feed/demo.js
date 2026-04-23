import '/dist-ai/paracharts.js';

const chart = document.getElementById('chart');
const addBtn = document.getElementById('add-btn');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const fwdBtn = document.getElementById('fwd-btn');
const latestText = document.getElementById('latest');
const maniText = document.getElementById('manifest');
const delayInput = document.getElementById('delay-input');
const minInput = document.getElementById('min-input');
const maxInput = document.getElementById('max-input');
const stepInput = document.getElementById('step-input');
const captionFormatInputs = document.querySelectorAll('input[name="caption-format"]');
const cpOpenInputs = document.querySelectorAll('input[name="cp-open"]');
const captionVisibleInputs = document.querySelectorAll('input[name="caption-visible"]');

let autoIntervalMs = 500;
let interval = null;
delayInput.value = autoIntervalMs;

let allRecords = {};    // { seriesKey: [{x, y}, ...] } — full history, never shrunk
let windowSize = 0;     // record count from the original manifest — fixed
let windowEnd = 0;      // exclusive end index into allRecords; chart shows [windowEnd-windowSize, windowEnd)
let baseManifest = null; // manifest structure with records stripped out, used as template

function initFromManifest() {
  const manifest = chart.paraState.manifest;
  baseManifest = JSON.parse(JSON.stringify(manifest));
  allRecords = {};
  const series = manifest.jim.datasets[0].series;
  for (const s of series) {
    allRecords[s.key] = s.records.map(r => ({ ...r }));
  }
  windowSize = series[0].records.length;
  windowEnd = windowSize;
}

const MODES = {
  single: {
    manifest: '/src/demo/live_feed/line-single-manifest.json',
    MIN: 35, MAX: 65, STEP: 0.15,
    SERIES: ['Number of users in millions'],
    BIAS: [0],
    addRecord() {
      const records = allRecords['Number of users in millions'];
      const prevY = parseFloat(records.at(-1).y);
      const raw = prevY + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[0]) * (this.MAX - this.MIN);
      records.push({ x: nextX(records.at(-1).x), y: reflect(raw, this.MIN, this.MAX).toFixed(1) });
    }
  },
  multi: {
    manifest: '/src/demo/live_feed/line-multi-manifest.json',
    MIN: 2, MAX: 8, STEP: 0.08,
    SERIES: ['Expenses', 'Revenue'],
    BIAS: [-0.005, 0.015],
    addRecord() {
      const r1 = allRecords['Expenses'];
      const r2 = allRecords['Revenue'];
      const range = this.MAX - this.MIN;
      r1.push({ x: nextX(r1.at(-1).x), y: reflect(parseFloat(r1.at(-1).y) + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[0]) * range, this.MIN, this.MAX).toFixed(1) });
      r2.push({ x: nextX(r2.at(-1).x), y: reflect(parseFloat(r2.at(-1).y) + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[1]) * range, this.MIN, this.MAX).toFixed(1) });
    }
  }
};

let activeMode = MODES.multi;

function reflect(value, min, max) {
  if (value < min) return 2 * min - value;
  if (value > max) return 2 * max - value;
  return value;
}

function nextX(x) {
  let [q, y] = x.split(' ');
  const qnum = parseInt(q[1]) % 4;
  q = `Q${qnum + 1}`;
  if (!qnum) y = `${parseInt(y) + 1}`;
  return `${q} ${y}`;
}

function totalRecords() {
  return allRecords[Object.keys(allRecords)[0]]?.length ?? 0;
}

// ── Window ────────────────────────────────────────────────────────────────────

function latestPoints() {
  const points = {};
  for (const [key, records] of Object.entries(allRecords)) {
    points[key] = records[windowEnd - 1];
  }
  return points;
}

async function sendWindow() {
  const manifest = JSON.parse(JSON.stringify(baseManifest));
  for (const s of manifest.jim.datasets[0].series) {
    s.records = allRecords[s.key].slice(windowEnd - windowSize, windowEnd);
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/json' }));
  await chart.api.setManifest(url);
  await chart.loaded;
  URL.revokeObjectURL(url);
}

function updateStepButtons() {
  backBtn.disabled = windowEnd <= windowSize;
  fwdBtn.disabled = windowEnd >= totalRecords();
}

async function stepBack() {
  if (windowEnd <= windowSize) return;
  stopInterval();
  windowEnd--;
  updateStepButtons();
  await sendWindow();
  updateLatestDisplay();
  updateManifestDisplay();
}

async function stepForward() {
  if (windowEnd >= totalRecords()) return;
  windowEnd++;
  updateStepButtons();
  await sendWindow();
  updateLatestDisplay();
  updateManifestDisplay();
}

backBtn.addEventListener('click', stepBack);
fwdBtn.addEventListener('click', stepForward);

// ── Range / bias controls ─────────────────────────────────────────────────────

function syncRangeInputs() {
  minInput.value = activeMode.MIN;
  maxInput.value = activeMode.MAX;
  stepInput.value = Math.round(activeMode.STEP * 100);
  renderBiasInputs();
}

function renderBiasInputs() {
  const container = document.getElementById('bias-controls');
  container.innerHTML = '';
  const isMulti = activeMode.SERIES.length > 1;
  activeMode.SERIES.forEach((name, i) => {
    const label = document.createElement('label');
    if (i > 0) label.classList.add('ac-pair-start');
    label.textContent = isMulti ? `${name} (%)` : 'Bias (%)';
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.value = (activeMode.BIAS[i] * 100).toFixed(1);
    input.addEventListener('change', () => { activeMode.BIAS[i] = parseFloat(input.value) / 100; });
    container.appendChild(label);
    container.appendChild(input);
  });
}

minInput.addEventListener('change', () => { activeMode.MIN = parseFloat(minInput.value); });
maxInput.addEventListener('change', () => { activeMode.MAX = parseFloat(maxInput.value); });
stepInput.addEventListener('change', () => { activeMode.STEP = parseFloat(stepInput.value) / 100; });

captionFormatInputs.forEach(input => {
  input.addEventListener('change', () => {
    chart.api.setConfigSetting('description.captionFormat', input.value);
  });
});

function resetCaptionFormat() {
  document.getElementById('caption-concise').checked = true;
}

cpOpenInputs.forEach(input => {
  input.addEventListener('change', () => {
    chart.api.setSetting('controlPanel.isControlPanelDefaultOpen', input.value === 'true');
  });
});

captionVisibleInputs.forEach(input => {
  input.addEventListener('change', () => {
    chart.api.setSetting('controlPanel.isCaptionVisible', input.value === 'true');
  });
});

function resetCpOpen() {
  document.getElementById('cp-open-off').checked = true;
}

function resetCaptionVisible() {
  document.getElementById('caption-visible-on').checked = true;
}

// ── Playback controls ─────────────────────────────────────────────────────────

function stopInterval() {
  if (!interval) return;
  clearInterval(interval);
  interval = null;
  startBtn.textContent = 'Start';
}

function startInterval() {
  interval = setInterval(async () => {
    if (windowEnd < totalRecords()) {
      windowEnd++;
      updateStepButtons();
      await sendWindow();
    } else {
      activeMode.addRecord();
      windowEnd = totalRecords();
      updateStepButtons();
      await chart.api.addRecord(latestPoints());
    }
    updateLatestDisplay();
    updateManifestDisplay();
  }, autoIntervalMs);
  startBtn.textContent = 'Stop';
}

function updateLatestDisplay() {
  latestText.textContent = Object.entries(allRecords)
    .map(([key, records]) => `${key}: x=${records[windowEnd - 1].x}, y=${records[windowEnd - 1].y}`)
    .join('\n');
}

function updateManifestDisplay() {
  maniText.textContent = JSON.stringify(chart.paraState.manifest, null, 2);
}

addBtn.addEventListener('click', async () => {
  if (interval) return;
  activeMode.addRecord();
  windowEnd = totalRecords();
  updateStepButtons();
  await chart.api.addRecord(latestPoints());
  updateLatestDisplay();
  updateManifestDisplay();
});

startBtn.addEventListener('click', () => {
  interval ? stopInterval() : startInterval();
});

resetBtn.addEventListener('click', async () => {
  stopInterval();
  await chart.api.setManifest(activeMode.manifest);
  await chart.loaded;
  initFromManifest();
  resetCaptionFormat();
  resetCpOpen();
  resetCaptionVisible();
  updateStepButtons();
  updateLatestDisplay();
  updateManifestDisplay();
});

delayInput.addEventListener('change', () => {
  autoIntervalMs = parseInt(delayInput.value);
  if (interval) {
    stopInterval();
    startInterval();
  }
});

document.querySelectorAll('input[name="mode"]').forEach(input => {
  input.addEventListener('change', async () => {
    stopInterval();
    activeMode = MODES[input.value];
    syncRangeInputs();
    await chart.api.setManifest(activeMode.manifest);
    await chart.loaded;
    initFromManifest();
    resetCaptionFormat();
    resetCpOpen();
    resetCaptionVisible();
    updateStepButtons();
    updateLatestDisplay();
    updateManifestDisplay();
  });
});

await chart.loaded;
initFromManifest();
syncRangeInputs();
updateStepButtons();
updateLatestDisplay();
updateManifestDisplay();
