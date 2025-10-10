# Manifest Format

Each chart is specified using a JSON manifest.
ParaCharts manifests are extended JIM objects (see [the JIM specification](https://inclusio-community.github.io/json-image-metadata/) for more details).

The `Manifest` type is defined in the [ParaManifest package](https://github.com/fizzstudio/ParaManifest).

{{#description}}
{{description}}
{{/description}}

A manifest has the following top-level properties. The table below lists each
property with its type, whether it is required, and a short description.

| Property | JSON path | Type | Required | Description |
|---|---|---|:---:|---|
{{#properties}}
| `{{name}}` | `{{path}}` | `{{type}}` {{#itemsType}}(items: `{{itemsType}}`){{/itemsType}} | {{#required}}Yes{{/required}}{{^required}}No{{/required}} | {{#description}}{{description}}{{/description}}{{^description}}No description available.{{/description}} |
{{/properties}}

If a property contains nested object properties, they are shown in a separate
subsection immediately after the parent property.

{{#properties}}
{{#children}}

### `{{path}}` — nested properties

The property at `{{path}}` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
{{#children}}
| `{{name}}` | `{{type}}` | {{#required}}Yes{{/required}}{{^required}}No{{/required}} | {{#description}}{{description}}{{/description}}{{^description}}No description.{{/description}} |
{{/children}}

{{/children}}
{{/properties}}
