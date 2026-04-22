import '/dist-ai/paracharts.js';

// ── Switch to true when chart.api.removeRecord() is implemented ──────────────
const USE_REMOVE_RECORD = false;
// ─────────────────────────────────────────────────────────────────────────────

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

let autoIntervalMs = 500;
let interval = null;
let futureBuffer = [];
let recordDelta = 0;
delayInput.value = autoIntervalMs;

function captureBaseCount() {
  recordDelta = 0;
}

const MODES = {
  single: {
    manifest: '/src/demo/live_feed/line-single-manifest.json',
    MIN: 35, MAX: 65, STEP: 0.15,
    SERIES: ['Number of users in millions'],
    BIAS: [0],
    async addRecord() {
      const records = chart.paraState.manifest.jim.datasets[0].series[0].records;
      const prevY = parseFloat(records.at(-1).y);
      const raw = prevY + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[0]) * (this.MAX - this.MIN);
      const y = reflect(raw, this.MIN, this.MAX);
      await chart.api.addRecord({
        'Number of users in millions': { x: nextX(records.at(-1).x), y: y.toFixed(1) }
      });
    }
  },
  multi: {
    manifest: '/src/demo/live_feed/line-multi-manifest.json',
    MIN: 2, MAX: 8, STEP: 0.08,
    SERIES: ['Expenses', 'Revenue'],
    BIAS: [-0.005, 0.015],
    async addRecord() {
      const series = chart.paraState.manifest.jim.datasets[0].series;
      const r1 = series[0].records, r2 = series[1].records;
      const range = this.MAX - this.MIN;
      const y1 = reflect(parseFloat(r1.at(-1).y) + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[0]) * range, this.MIN, this.MAX);
      const y2 = reflect(parseFloat(r2.at(-1).y) + ((Math.random() * 2 - 1) * this.STEP + this.BIAS[1]) * range, this.MIN, this.MAX);
      await chart.api.addRecord({
        Expenses: { x: nextX(r1.at(-1).x), y: y1.toFixed(1) },
        Revenue:  { x: nextX(r2.at(-1).x), y: y2.toFixed(1) }
      });
    }
  }
};

let activeMode = MODES.single;

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

// ── Playback ──────────────────────────────────────────────────────────────────

function snapshotLastRecord() {
  const series = chart.paraState.manifest.jim.datasets[0].series;
  const snapshot = {};
  for (const s of series) snapshot[s.key] = { ...s.records.at(-1) };
  return snapshot;
}

async function stepBack() {
  if (recordDelta <= 0) return;

  stopInterval();
  const snapshot = snapshotLastRecord();

  if (USE_REMOVE_RECORD) {
    // ── PRIMARY: chart.api.removeRecord() ────────────────────────────────────
    await chart.api.removeRecord();
    // ─────────────────────────────────────────────────────────────────────────
  } else {
    // ── FALLBACK: rebuild manifest via setManifest() ──────────────────────────
    const modified = JSON.parse(JSON.stringify(chart.paraState.manifest));
    for (const s of modified.jim.datasets[0].series) s.records.pop();
    const blob = new Blob([JSON.stringify(modified)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    await chart.api.setManifest(url);
    await chart.loaded;
    URL.revokeObjectURL(url);
    // ─────────────────────────────────────────────────────────────────────────
  }

  recordDelta--;
  futureBuffer.unshift(snapshot);
  updateStepButtons();
  updateLatestDisplay();
  updateManifestDisplay();
}

async function stepForward() {
  if (!futureBuffer.length) return;
  const snapshot = futureBuffer.shift();
  await chart.api.addRecord(snapshot);
  recordDelta++;
  updateStepButtons();
  updateLatestDisplay();
  updateManifestDisplay();
}

function clearFutureBuffer() {
  futureBuffer = [];
  updateStepButtons();
}

function updateStepButtons() {
  backBtn.disabled = recordDelta <= 0;
  fwdBtn.disabled = futureBuffer.length === 0;
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

// ── Playback controls ─────────────────────────────────────────────────────────

function stopInterval() {
  if (!interval) return;
  clearInterval(interval);
  interval = null;
  startBtn.textContent = 'Start';
}

function startInterval() {
  interval = setInterval(async () => {
    await activeMode.addRecord();
    recordDelta++;
    clearFutureBuffer();
    updateLatestDisplay();
    updateManifestDisplay();
  }, autoIntervalMs);
  startBtn.textContent = 'Stop';
}

function updateLatestDisplay() {
  const series = chart.paraState.manifest.jim.datasets[0].series;
  latestText.textContent = series
    .map(s => `${s.key}: x=${s.records.at(-1).x}, y=${s.records.at(-1).y}`)
    .join('\n');
}

function updateManifestDisplay() {
  maniText.textContent = JSON.stringify(chart.paraState.manifest, null, 2);
}

addBtn.addEventListener('click', async () => {
  if (interval) return;
  await activeMode.addRecord();
  recordDelta++;
  clearFutureBuffer();
  updateLatestDisplay();
  updateManifestDisplay();
});

startBtn.addEventListener('click', () => {
  interval ? stopInterval() : startInterval();
});

resetBtn.addEventListener('click', async () => {
  stopInterval();
  clearFutureBuffer();
  await chart.api.setManifest(activeMode.manifest);
  await chart.loaded;
  captureBaseCount();
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
    clearFutureBuffer();
    activeMode = MODES[input.value];
    syncRangeInputs();
    await chart.api.setManifest(activeMode.manifest);
    await chart.loaded;
    captureBaseCount();
    updateStepButtons();
    updateLatestDisplay();
    updateManifestDisplay();
  });
});

await chart.loaded;
captureBaseCount();
syncRangeInputs();
updateStepButtons();
updateLatestDisplay();
updateManifestDisplay();
