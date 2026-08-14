# {{title}} Configuration

[{{backLabel}}]({{backLink}})

{{description}}

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
{{#settings}}
| `{{path}}` | {{description}} | `{{defaultValue}}` | {{validValues}} |
{{/settings}}

{{#hasTypeDefinitions}}
## Type Definitions

{{#typeDefinitions}}
- <span id="{{id}}"></span>**{{name}}**: {{definition}}
{{/typeDefinitions}}
{{/hasTypeDefinitions}}
