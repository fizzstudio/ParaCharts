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

The 331 documented settings are split into focused reference pages. Settings marked with † are advanced.

| Category | Description | Settings |
|---|---|---:|
| [Animation](config/animation.md) | Chart animation timing and effects. | 6 |
| [Axis](config/axis.md) | Axis display, labels, ticks, and positioning. | 56 |
| [Chart](config/chart.md) | Overall chart appearance and behavior settings. | 42 |
| [Color](config/color.md) | Color schemes, palettes, contrast, and vision accessibility. | 26 |
| [Control Panel](config/controlPanel.md) | Control panel visibility, layout, and available features. | 19 |
| [Description](config/description.md) | Generated chart description settings. | 1 |
| [Grid](config/grid.md) | Grid line display settings. | 4 |
| [Legend](config/legend.md) | Legend visibility, positioning, and styling. | 13 |
| [Popup](config/popup.md) | Tooltip and popup styling. | 13 |
| [Scrollytelling](config/scrollytelling.md) | Narrative scrolling features. | 3 |
| [Sonification](config/sonification.md) | Audio feedback and sonification settings. | 7 |
| [Chart Types](config/type.md) | Chart type-specific settings. | 126 |
| [UI](config/ui.md) | User interface and accessibility features. | 15 |

## Contributor Reference

- [Defining settings](config/descriptors.md): descriptor fields, inheritance, generated artifacts, and internal update behavior.
- [Chart-type defaults](config/chart-type-defaults.md): overrides applied outside each chart type's own setting group.
