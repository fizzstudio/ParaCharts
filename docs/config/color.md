# Color Configuration

[Back to configuration](../config.md)

Color schemes, palettes, contrast, and vision accessibility.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `color.colorVisionMode` | Color vision deficiency simulation mode | `"normal"` | [color.colorVisionMode values](#color-colorvisionmode-values) |
| `color.isDarkModeEnabled` | Enable dark color scheme | `false` | boolean |
| `color.contrastLevel` | Contrast adjustment level (0-2) | `1` | number [0, 1] |
| `color.colorPalette` | Name of the color palette to use | `"diva"` | string |
| `color.colorMap` | *Comma-separated list of custom color names* † | `""` | string |
| `color.custom1` | Custom color 1 | `""` | string |
| `color.custom2` | Custom color 2 | `""` | string |
| `color.custom3` | Custom color 3 | `""` | string |
| `color.custom4` | Custom color 4 | `""` | string |
| `color.custom5` | Custom color 5 | `""` | string |
| `color.custom6` | Custom color 6 | `""` | string |
| `color.custom7` | Custom color 7 | `""` | string |
| `color.custom8` | Custom color 8 | `""` | string |
| `color.themeMode` | Color theme preference: automatic, always light, or always dark | `"auto"` | 'auto' \| 'light' \| 'dark' |
| `color.themeSource` | *Source of the current theme setting* † | `"default"` | [ColorPrefSource](#colorprefsource) |
| `color.contrastMode` | Contrast level preference: follow system, lower, normal, higher, or custom | `"system"` | [color.contrastMode values](#color-contrastmode-values) |
| `color.contrastSource` | *Source of the current contrast setting* † | `"default"` | [ColorPrefSource](#colorprefsource) |
| `color.forcedColorsMode` | *How to respond to forced-colors system mode* † | `"system"` | 'system' \| 'respect' |
| `color.invertedColorsMode` | *How to respond to inverted-colors system mode* † | `"system"` | 'system' \| 'adapt' |
| `color.lowVisionColorPalette` | *Use the low-vision high-contrast color palette when low-vision mode is enabled* † | `true` | boolean |
| `color.lowVisionThemeDefault` | *Theme to apply as a mode default when low-vision mode is enabled* † | `"dark"` | 'auto' \| 'light' \| 'dark' |
| `color.lowVisionContrastDefault` | *Contrast mode to apply as a mode default when low-vision mode is enabled* † | `"higher"` | [color.lowVisionContrastDefault values](#color-lowvisioncontrastdefault-values) |
| `color.lowVisionContrastLevel` | *Contrast level for custom low-vision contrast (0-1)* † | `1` | number |
| `color.backgroundColor` | *Resolved active background color (oklch string, set by ColorPrefManager)* † | `""` | string |
| `color.backgroundColorLight` | *Explicit background color for light mode as an oklch() string. Empty string uses the theme default.* † | `""` | string |
| `color.backgroundColorDark` | *Explicit background color for dark mode as an oklch() string. Empty string uses the theme default.* † | `""` | string |

## Type Definitions

- <span id="color-colorvisionmode-values"></span>**color.colorVisionMode values**: 'normal' \| 'deutan' \| 'protan' \| 'tritan' \| 'grayscale'
- <span id="colorprefsource"></span>**ColorPrefSource**: 'default' \| 'chartDefault' \| 'modeDefault' \| 'profile' \| 'system' \| 'user'
- <span id="color-contrastmode-values"></span>**color.contrastMode values**: 'system' \| 'lower' \| 'normal' \| 'higher' \| 'custom'
- <span id="color-lowvisioncontrastdefault-values"></span>**color.lowVisionContrastDefault values**: 'system' \| 'lower' \| 'normal' \| 'higher' \| 'custom'
