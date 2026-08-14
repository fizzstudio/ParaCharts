# Liblouis Test Assets

These tests use the WebAssembly binary and table archive copied from
viewplus-braille-web commit `29a64abae01bb9bbcef9c095a203bc34fb46ad92`.
That project builds Liblouis from commit
`7702f1240e1575f9c19b2b399c6989a267ecca8f` (tag `v3.35.0`).

- Integration source: https://github.com/inclusio-community/viewplus-braille-web/tree/29a64abae01bb9bbcef9c095a203bc34fb46ad92
- Liblouis source: https://github.com/liblouis/liblouis/tree/7702f1240e1575f9c19b2b399c6989a267ecca8f
- Runtime: ViewPlus WebAssembly binary and preloaded table archive, loaded by
  the Emscripten ES module retained from the initial ParaCharts integration
- Build pipeline: https://github.com/inclusio-community/viewplus-braille-web/blob/29a64abae01bb9bbcef9c095a203bc34fb46ad92/liblouis-wrapper/build-in-docker.sh
- Build toolchain: the `emscripten/emsdk:latest` Docker image used by that pipeline

The ViewPlus integration repository is access-controlled; its source and build
pipeline links require appropriate GitHub permissions.

The WebAssembly file is not sufficient by itself: the generated ES module
initializes the Emscripten runtime and virtual filesystem, while the data
archive supplies the UEB translation tables and their dependencies.

The `.data` archive contains UEB Grade 1 and Grade 2 tables and their included
dependencies. Liblouis and the bundled tables are distributed under the GNU
Lesser General Public License, version 2.1 or later. The complete license is in
[`vendor/liblouis-runtime/COPYING.LESSER`](vendor/liblouis-runtime/COPYING.LESSER), and the
table headers identify their copyright holders. `lib/braille/nabcc_to_unicode.ts`
is generated from Liblouis's LGPL-licensed `tables/text_nabcc.dis`. The generated
JavaScript also contains Emscripten runtime code under the MIT or University of
Illinois/NCSA license in
[`vendor/liblouis-runtime/EMSCRIPTEN_LICENSE`](vendor/liblouis-runtime/EMSCRIPTEN_LICENSE).
These artifacts are test-only and are not imported into the ParaCharts library
bundle. The links above identify the source and build pipeline for the WASM and
table archive. The retained JavaScript loader's exact historical Emscripten
version is unknown; its checksum below identifies the distributed file.

Loader replacement criteria are documented in
[`vendor/liblouis-runtime/README.md`](vendor/liblouis-runtime/README.md).

Artifact SHA-256 checksums:

- `liblouisWASM.js`: `8776c3c596dffec5de54ba708cd5eed63616e4f1be61ede05141c6b3566491ee`
- `liblouisWASM.wasm`: `2d33cf4af7bacb061d1b18821b9ea0601aab8aa80242020ce1f3e9a80ac1068f`
- `liblouisWASM.data`: `a3133529d5e86691b86cfafa1b6103cd4ac2676ceac7681b43abe8486ef27ace`

The pinned Git source reports version 3.34.0 at runtime because the `v3.35.0`
tag did not update its `configure.ac` version string.
