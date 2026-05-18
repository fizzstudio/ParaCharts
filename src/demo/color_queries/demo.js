const chart = document.getElementById('chart');

await chart.loaded;

const state = chart.paraState;

// ---------------------------------------------------------------------------
// System query state indicators
// ---------------------------------------------------------------------------

const queries = [
  ['(prefers-color-scheme: dark)',  'ind-dark'],
  ['(prefers-contrast: more)',      'ind-contrast-more'],
  ['(prefers-contrast: less)',      'ind-contrast-less'],
  ['(forced-colors: active)',       'ind-forced'],
  ['(inverted-colors: inverted)',   'ind-inverted'],
];

function updateIndicator(elementId, matches) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.dataset.active = String(matches);
  el.textContent = matches ? 'active' : 'inactive';
}

for (const [query, elementId] of queries) {
  const mql = matchMedia(query);
  updateIndicator(elementId, mql.matches);
  mql.addEventListener('change', (e) => updateIndicator(elementId, e.matches));
}

// ---------------------------------------------------------------------------
// Resolved state display
// ---------------------------------------------------------------------------

function updateResolvedState() {
  const color = state.config.color;

  const elDark = document.getElementById('resolved-dark');
  if (elDark) {
    elDark.textContent = String(color.isDarkModeEnabled);
    elDark.dataset.active = String(color.isDarkModeEnabled);
  }
  const elLevel = document.getElementById('resolved-contrast');
  if (elLevel) elLevel.textContent = color.contrastLevel.toFixed(1);
  const elThemeMode = document.getElementById('resolved-theme-mode');
  if (elThemeMode) elThemeMode.textContent = color.themeMode;
  const elThemeSource = document.getElementById('resolved-theme-source');
  if (elThemeSource) elThemeSource.textContent = color.themeSource;
  const elContrastMode = document.getElementById('resolved-contrast-mode');
  if (elContrastMode) elContrastMode.textContent = color.contrastMode;
  const elContrastSource = document.getElementById('resolved-contrast-source');
  if (elContrastSource) elContrastSource.textContent = color.contrastSource;
}

state.observeSetting('color.isDarkModeEnabled', updateResolvedState);
state.observeSetting('color.contrastLevel', updateResolvedState);
state.observeSetting('color.themeMode', updateResolvedState);
state.observeSetting('color.themeSource', updateResolvedState);
state.observeSetting('color.contrastMode', updateResolvedState);
state.observeSetting('color.contrastSource', updateResolvedState);
updateResolvedState();

// ---------------------------------------------------------------------------
// localStorage display
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'paracharts:colorPreferences:v1';

function updateStorageDisplay() {
  const el = document.getElementById('storage-contents');
  if (!el) return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { el.textContent = JSON.stringify(JSON.parse(raw), null, 2); }
    catch { el.textContent = raw; }
  } else {
    el.textContent = '(nothing stored)';
  }
}

updateStorageDisplay();
state.observeSetting('color.themeMode', updateStorageDisplay);
state.observeSetting('color.contrastMode', updateStorageDisplay);

document.getElementById('clear-storage')?.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  updateStorageDisplay();
});

// ---------------------------------------------------------------------------
// Preference controls (direct API — mirrors the control panel)
// ---------------------------------------------------------------------------

function bindRadios(name, configPath) {
  const [group, key] = configPath.split('.');
  const radios = Array.from(document.querySelectorAll(`input[name="${name}"]`));

  function syncRadios() {
    const current = state.config[group][key];
    for (const r of radios) r.checked = r.value === current;
  }

  state.observeSetting(configPath, syncRadios);
  syncRadios();

  for (const radio of radios) {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      state.updateConfig(draft => { draft[group][key] = radio.value; });
    });
  }
}

bindRadios('theme-mode', 'color.themeMode');
bindRadios('contrast-mode', 'color.contrastMode');

// Custom contrast slider — only visible when contrastMode === 'custom'
const contrastSlider = document.getElementById('contrast-custom');
const contrastSliderWrap = document.getElementById('contrast-slider-wrap');

function syncCustomSlider() {
  const isCustom = state.config.color.contrastMode === 'custom';
  if (contrastSliderWrap) contrastSliderWrap.hidden = !isCustom;
  if (contrastSlider) contrastSlider.value = String(state.config.color.contrastLevel);
}

state.observeSetting('color.contrastMode', syncCustomSlider);
state.observeSetting('color.contrastLevel', syncCustomSlider);
syncCustomSlider();

contrastSlider?.addEventListener('input', () => {
  state.updateConfig(draft => { draft.color.contrastLevel = parseFloat(contrastSlider.value); });
});
