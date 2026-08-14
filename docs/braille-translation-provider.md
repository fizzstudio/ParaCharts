# Braille Translation Providers

The Grade 1 setting preserves ParaCharts' historical simple 64-cell mapping,
now emitted as portable Unicode Braille instead of through a bundled font. It
is character substitution, not full literary Grade 1: it does not add capital
or number indicators, and characters outside the mapping remain unchanged.

Applications add Grade 2 contractions by registering an instance-scoped
provider through `chart.api` before loading the chart:

```ts
import type {
  BrailleTranslationProvider,
} from '@fizz/paracharts';

const provider: BrailleTranslationProvider = {
  async ready() {
    // Load the translator, tables, and any WASM runtime once.
  },
  translate(text: string) {
    // This method must be synchronous after ready() resolves.
    // Return Unicode Braille Pattern characters (U+2800-U+28FF).
    return translator.translateGrade2(text);
  },
};

await chart.ready;
await chart.api.registerBrailleTranslationProvider(provider);
chart.manifest = serializedManifest;
```

Headless charts use the same API:

```ts
const headless = new ParaHeadless();
await headless.ready();
await headless.api.registerBrailleTranslationProvider(provider);

const result = await headless.loadManifest(manifest, 'content', {
  isTactileEnabled: true,
  tactileBrailleGrade: 2,
  tactileLabelMode: 'Both',
});
```

Await registration before loading to use Grade 2 on the first render. If
initialization overlaps loading, ParaCharts renders the simple mapping and
refreshes the chart when the provider becomes ready. Grade 2 also falls back to
the simple mapping if the provider is unavailable or rejects a label. The
default remains Grade 1 with `Both` labels. `Latin` renders only source text and
`None` omits tactile labels.

Providers translate print text only. Unicode Braille output avoids a
dependency on a bundled Braille font and remains portable in serialized
SVG. ParaCharts owns label modes, layout, source-text accessibility metadata,
caching, the simple fallback, and SVG serialization. Back
translation, Liblouis table names, Emscripten types, and runtime asset URLs are
intentionally outside the provider contract.

The browser integration adapter and copied ViewPlus runtime under
`src/tests/fixtures/liblouis/` are test-only and are not part of the published
ParaCharts bundle. Runtime provenance and update instructions live beside those
assets in `THIRD_PARTY_NOTICES.md` and `vendor/liblouis-runtime/README.md`.
