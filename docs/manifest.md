# Manifest Format

Each chart is specified using a JSON manifest.
ParaCharts manifests are extended JIM objects (see [the JIM specification](https://inclusio-community.github.io/json-image-metadata/) for more details).

The `Manifest` type is defined in the [ParaManifest package](https://github.com/fizzstudio/ParaManifest).

Metadata, settings, and optionally inline data needed to present a ParaCharts element, as an enveloped form JIM document. @public

A manifest has the following top-level properties. The table below lists each
property with its type, whether it is required, and a short description.

| Property | JSON path | Type | Required | Description |
|---|---|---|:---:|---|
| `jim` | `jim` | `ref:./schema/jim_manifest.schema.json`  | Yes | No description available. |
| `extensions` | `extensions` | `ref:./schema/extensions_manifest.schema.json`  | No | No description available. |

If a property contains nested object properties, they are shown in a separate
subsection immediately after the parent property.

