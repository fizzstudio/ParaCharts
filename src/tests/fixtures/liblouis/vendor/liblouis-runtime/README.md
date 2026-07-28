# Liblouis test runtime

This directory is the runtime asset boundary for the ParaCharts browser
integration tests. It contains:

- `liblouisWASM.wasm` and `liblouisWASM.data`, copied unchanged from
  viewplus-braille-web commit `29a64abae01bb9bbcef9c095a203bc34fb46ad92`.
- `liblouisWASM.js`, the compatible Emscripten loader for those assets.
- The Liblouis and Emscripten license texts.

The pinned revision's loader did not pass ParaCharts' UEB integration test with
the copied table archive, so this directory retains the loader from the initial
ParaCharts integration. Its exact historical Emscripten version is unavailable;
the checksum in `THIRD_PARTY_NOTICES.md` identifies the distributed file until
it can be replaced by a reproducible loader.

`../../liblouis-provider.ts` is the only code that should import this
directory. To update the runtime:

1. Build or obtain all three artifacts from one ViewPlus revision.
2. Replace the `.wasm` and `.data` files together; do not mix build revisions.
3. Run the integration test with the loader produced by that build. Replace the
   retained loader when the matched artifact set passes.
4. Run `npm run test:browser -- src/tests/browser/braille_translation.test.ts`.
5. Update the revision and SHA-256 checksums in `THIRD_PARTY_NOTICES.md`.

The artifacts are generated files and should not be hand-edited. Source and
build-pipeline links for the WASM and data archive are recorded in
`THIRD_PARTY_NOTICES.md`.
