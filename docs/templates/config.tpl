# Configuration

Customize chart appearance, behavior, and accessibility with settings identified by dotted paths. Values passed by an author override the defaults in the linked settings reference.

## Using Configuration

Configuration is stored as a hierarchical tree. A dotted setting path identifies a leaf in that tree: for example, `ui.isVoicingEnabled` refers to `config.ui.isVoicingEnabled`.

Use the chart's [ParaAPI](paraapi.md) to read or change configuration from application code:

```ts
const chart = document.querySelector('para-chart')!;

chart.api.setConfigSetting('ui.isVoicingEnabled', true);
chart.api.setConfigSettings({
  'chart.fontScale': 1.5,
  'grid.isDrawVertLines': false
});

const fontScale = chart.api.getConfigSetting('chart.fontScale');
const allSettings = chart.api.getAllConfigSettings();
```

`getConfigSettings()` reads selected paths. `getConfigGroupMetadata()` returns the descriptor for a group, and `getConfigSettingsMetadata()` finds setting descriptors matching all supplied keywords.

## Settings Reference

The {{settingCount}} documented settings are split into focused reference pages. Settings marked with † are advanced.

| Category | Description | Settings |
|---|---|---:|
{{#categoryLinks}}
| [{{name}}]({{link}}) | {{description}} | {{settingCount}} |
{{/categoryLinks}}

## Contributor Reference

- [Defining settings](config/descriptors.md): descriptor fields, inheritance, generated artifacts, and internal update behavior.
- [Chart-type defaults](config/chart-type-defaults.md): overrides applied outside each chart type's own setting group.
