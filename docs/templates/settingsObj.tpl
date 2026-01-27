# Settings Object

Customize chart appearance, behavior, and accessibility using the hierarchical settings object. Pass settings when creating charts to override defaults.

## Usage Example

```javascript
const chart = new ParaChart({
  data: myData,
  settings: {
    'chart.type': 'line',
    'chart.size.width': 800,
    'ui.isVoicingEnabled': true,
    'color.isDarkModeEnabled': true
  }
});
```

## Settings

{{#categories}}
### {{name}}

{{#description}}{{description}}

{{/description}}
| Setting Path | Description | Default | Type |
|---|---|---|---|
{{#settings}}
| `{{path}}` | {{#description}}{{description}}{{/description}}{{^description}}{{#path}}{{#isBoolean}}Enable/disable {{simpleName}}{{/isBoolean}}{{^isBoolean}}Set {{simpleName}}{{/isBoolean}}{{/path}}{{/description}} | {{#defaultValue}}{{defaultValue}}{{/defaultValue}}{{^defaultValue}}*none*{{/defaultValue}} | `{{simpleType}}` |
{{/settings}}

{{/categories}}