# Settings Object

Customize chart appearance, behavior, and accessibility using the hierarchical settings object. Settings are organized by category and can be passed to override defaults.

## Common Settings

| Setting Path | Description | Default | Type |
|---|---|---|---|
{{#commonSettings}}
| `{{path}}` | {{description}} | `{{defaultValue}}` | `{{type}}` |
{{/commonSettings}}

## All Settings

{{#categories}}
### {{name}}

| Setting Path | Description | Default | Type |
|---|---|---|---|
{{#settings}}
| `{{path}}` | {{description}} | `{{defaultValue}}` | `{{type}}` |
{{/settings}}

{{/categories}}