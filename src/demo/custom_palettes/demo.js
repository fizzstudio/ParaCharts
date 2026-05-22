const chart = document.getElementById('chart');

await chart.loaded;

const api   = chart.api;
const state = chart.paraState;

// ---------------------------------------------------------------------------
// Active palette strip — swatches under the chart
// ---------------------------------------------------------------------------

function updateActivePaletteStrip() {
  const model = api.getResolvedColorModel();

  document.getElementById('current-palette-id').textContent = `(${model.paletteId})`;

  const container = document.getElementById('current-swatches');
  container.innerHTML = '';
  for (const { id, value } of model.colors) {
    const swatch = document.createElement('div');
    swatch.className = 'cswatch';
    swatch.style.background = value;
    swatch.title = `${id}: ${value}`;
    container.appendChild(swatch);
  }
}

state.observeSetting('color.colorPalette', updateActivePaletteStrip);
updateActivePaletteStrip();

// ---------------------------------------------------------------------------
// Color row builder — each row: picker | value text | label text | ×
// ---------------------------------------------------------------------------

const colorList = document.getElementById('color-list');

function slugify(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function addColorRow({ value = '#888888', label = '' } = {}) {
  const row = document.createElement('div');
  row.className = 'color-row';

  const picker = document.createElement('input');
  picker.type  = 'color';
  picker.value = cssToHex(value) || '#888888';

  const valueInput = document.createElement('input');
  valueInput.type        = 'text';
  valueInput.value       = value;
  valueInput.placeholder = '#rrggbb or hsl(…)';
  valueInput.spellcheck  = false;

  const labelInput = document.createElement('input');
  labelInput.type        = 'text';
  labelInput.value       = label;
  labelInput.placeholder = 'e.g. Brand blue';
  labelInput.spellcheck  = false;

  const delBtn = document.createElement('button');
  delBtn.className   = 'del-btn';
  delBtn.type        = 'button';
  delBtn.textContent = '×';
  delBtn.setAttribute('aria-label', 'Remove color');

  // Sync picker → text field
  picker.addEventListener('input', () => {
    valueInput.value = picker.value;
    updateJsonPreview();
  });

  // Sync text field → picker (works for hex; best-effort for hsl/oklch)
  valueInput.addEventListener('input', () => {
    const hex = cssToHex(valueInput.value);
    if (hex) picker.value = hex;
    updateJsonPreview();
  });

  labelInput.addEventListener('input', updateJsonPreview);

  delBtn.addEventListener('click', () => {
    row.remove();
    updateJsonPreview();
  });

  row.appendChild(picker);
  row.appendChild(valueInput);
  row.appendChild(labelInput);
  row.appendChild(delBtn);
  colorList.appendChild(row);
}

document.getElementById('add-color-btn').addEventListener('click', () => {
  addColorRow();
  updateJsonPreview();
});

// ---------------------------------------------------------------------------
// Color generator
// ---------------------------------------------------------------------------

function generateColors(count, style) {
  const values = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    let h;
    if (style === 'equidistant') {
      h = Math.round((i / count) * 360);
    } else if (style === 'warm') {
      h = Math.round(t * 60);          // 0° red → 60° yellow
    } else if (style === 'cool') {
      h = Math.round(180 + t * 90);    // 180° cyan → 270° violet
    } else {                            // random
      h = Math.round(Math.random() * 360);
    }
    values.push(`hsl(${h}, 70%, 48%)`);
  }
  return values;
}

document.getElementById('gen-btn').addEventListener('click', () => {
  const count = Math.max(2, Math.min(12, parseInt(document.getElementById('gen-count').value, 10) || 6));
  const style = document.getElementById('gen-style').value;

  colorList.innerHTML = '';
  for (const value of generateColors(count, style)) {
    addColorRow({ value });
  }
  updateJsonPreview();
});

// ---------------------------------------------------------------------------
// Populate editor from the chart's current palette
// ---------------------------------------------------------------------------

function populateEditorFromChart() {
  const model = api.getResolvedColorModel();
  colorList.innerHTML = '';

  const isBuiltIn = ['diva', 'warm', 'cool', 'pattern', 'deutan', 'protan', 'tritan', 'grayscale'].includes(model.paletteId);
  if (!isBuiltIn) {
    document.getElementById('palette-id').value = model.paletteId;
  }

  for (const { id, value } of model.colors) {
    addColorRow({ value, label: id });
  }
  updateJsonPreview();
}

// ---------------------------------------------------------------------------
// Build the CustomPaletteSpec from editor state
// ---------------------------------------------------------------------------

function buildPaletteSpec() {
  const id   = document.getElementById('palette-id').value.trim() || 'custom';
  const name = document.getElementById('palette-name').value.trim() || id;

  const rows = colorList.querySelectorAll('.color-row');
  const colors = Array.from(rows).map((row, i) => {
    const [valueInput, labelInput] = row.querySelectorAll('input[type="text"]');
    const labelText = labelInput.value.trim();
    const colorId   = (labelText ? slugify(labelText) : '') || `color-${i}`;
    const entry     = { id: colorId, value: valueInput.value.trim() || '#888888' };
    if (labelText) entry.label = labelText;
    return entry;
  });

  return { id, name, colors };
}

// ---------------------------------------------------------------------------
// JSON preview (inside the <details> element)
// ---------------------------------------------------------------------------

const jsonOutput = document.getElementById('json-output');

function updateJsonPreview() {
  const spec = buildPaletteSpec();
  const fragment = {
    extensions: {
      paracharts: {
        style: { color: { palette: spec } },
        settings: { 'color.colorPalette': spec.id }
      }
    }
  };
  jsonOutput.textContent = JSON.stringify(fragment, null, 2);
}

document.getElementById('palette-id').addEventListener('input', updateJsonPreview);
document.getElementById('palette-name').addEventListener('input', updateJsonPreview);

// ---------------------------------------------------------------------------
// Apply via API
// ---------------------------------------------------------------------------

document.getElementById('apply-api-btn').addEventListener('click', () => {
  const spec = buildPaletteSpec();
  api.setColorPalette(spec);
  showStatus('Palette applied via API');
});

// ---------------------------------------------------------------------------
// Apply via manifest
// ---------------------------------------------------------------------------

document.getElementById('apply-manifest-btn').addEventListener('click', () => {
  const manifest = state.manifest;
  if (!manifest) {
    showStatus('No manifest loaded', true);
    return;
  }

  const spec = buildPaletteSpec();
  const updated = JSON.parse(JSON.stringify(manifest));
  updated.extensions ??= {};
  updated.extensions.paracharts ??= {};
  updated.extensions.paracharts.style ??= {};
  updated.extensions.paracharts.style.color ??= {};
  updated.extensions.paracharts.style.color.palette = spec;
  updated.extensions.paracharts.settings ??= {};
  updated.extensions.paracharts.settings['color.colorPalette'] = spec.id;

  state.setManifest(updated);
  showStatus('Palette applied via manifest');
});

// ---------------------------------------------------------------------------
// Load preset manifest
// ---------------------------------------------------------------------------

document.getElementById('load-preset-btn').addEventListener('click', async () => {
  const url = document.getElementById('preset-select').value;
  if (!url) return;
  chart.manifest = url;
  await chart.loaded;
  populateEditorFromChart();
  updateActivePaletteStrip();
  showStatus('Chart loaded');
});

// ---------------------------------------------------------------------------
// Load manifest from file
// ---------------------------------------------------------------------------

document.getElementById('open-file-btn').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const manifest = JSON.parse(text);
    state.setManifest(manifest);
    await chart.loaded;
    populateEditorFromChart();
    updateActivePaletteStrip();
    showStatus(`Loaded: ${file.name}`);
  } catch (err) {
    showStatus(`Error: ${err.message}`, true);
  }
  e.target.value = '';
});

// ---------------------------------------------------------------------------
// Initial editor — start with 6 generated colors, not the chart's full palette
// ---------------------------------------------------------------------------

for (const value of generateColors(6, 'equidistant')) {
  addColorRow({ value });
}
updateJsonPreview();

// ---------------------------------------------------------------------------
// Utility: try to convert any CSS color string to 6-digit hex for the picker
// ---------------------------------------------------------------------------

function cssToHex(css) {
  const s = (css ?? '').trim();
  if (!s) return '';
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    const [, r, g, b] = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  try {
    const canvas = Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = s;
    const resolved = ctx.fillStyle;
    if (/^#[0-9a-f]{6}$/i.test(resolved)) return resolved;
    const m = resolved.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (m) return '#' + m.slice(1).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  } catch { /* ignore */ }
  return '';
}

// ---------------------------------------------------------------------------
// Status toast
// ---------------------------------------------------------------------------

let statusTimer = null;

function showStatus(msg, isError = false) {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? 'var(--danger)' : 'var(--success)';
  el.classList.remove('hidden');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}
