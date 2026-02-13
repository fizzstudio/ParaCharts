# Settings Object

Customize chart appearance, behavior, and accessibility using the hierarchical settings object. Pass settings when creating charts to override defaults.

## Settings

{{#categories}}
### {{name}}

{{#description}}{{description}}

{{/description}}
| Setting Path | Description | Default | Type |
|---|---|---|---|
{{#settings}}
| `{{path}}` | {{#description}}{{description}}{{/description}}{{^description}}{{#path}}{{#isBoolean}}Enable/disable {{simpleName}}{{/isBoolean}}{{^isBoolean}}Set {{simpleName}}{{/isBoolean}}{{/path}}{{/description}} | {{#defaultValue}}{{defaultValue}}{{/defaultValue}}{{^defaultValue}}*none*{{/defaultValue}} | {{validValues}} |
{{/settings}}

{{#typeDefinitions.length}}
**Type Definitions:**

{{#typeDefinitions}}
- <span id="{{id}}"></span>**{{name}}**: {{definition}}
{{/typeDefinitions}}

{{/typeDefinitions.length}}
{{/categories}}