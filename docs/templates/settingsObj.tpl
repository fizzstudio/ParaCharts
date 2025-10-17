# Settings Object

The settings object is used to customize the appearance, behavior, and accessibility features of ParaCharts. Settings can be passed to a `para-chart` element to override default values and tailor the chart to specific needs.

Settings are organized into logical groups that control different aspects of the chart. Each setting has a hierarchical path (like `chart.title.fontSize` or `ui.isVoicingEnabled`) that allows fine-grained control over chart presentation.

## Setting Categories

The following table shows the main setting categories available in ParaCharts:

| Category | Purpose | Key Areas |
|---|---|---|
| `chart` | Overall chart appearance and behavior | Chart type, size, title, orientation, fonts, symbols |
| `axis` | X and Y axis configuration | Axis lines, ticks, labels, ranges, intervals |
| `legend` | Legend display and positioning | Visibility, position, styling, item ordering |
| `ui` | User interface and accessibility | Voice output, announcements, focus ring, low vision mode |
| `sonification` | Audio feedback and sonification | Audio enabled/disabled, frequency ranges, playback speed |
| `color` | Color schemes and vision support | Color palettes, dark mode, color vision deficiency modes |
| `controlPanel` | Control panel behavior | Panel visibility, tab configuration, caption settings |
| `grid` | Chart grid lines | Horizontal/vertical grid line visibility |
| `plotArea` | Plot area dimensions | Size and layout of the main chart area |
| `popup` | Data point popups | Popup styling, positioning, and activation |
| `type` | Chart type specific settings | Bar width, line thickness, point sizes (varies by chart type) |

## Key Settings

Some of the most commonly used settings across categories:

| Setting Path | Description | Common Values |
|---|---|---|
| `chart.type` | The type of chart to display | `'bar'`, `'line'`, `'scatter'`, `'pie'`, etc. |
| `chart.size.width` | Chart width in pixels | `600` (default), or any positive number |
| `chart.size.height` | Chart height in pixels | `450` (default), or any positive number |
| `chart.title.text` | Chart title text | Any string |
| `ui.isVoicingEnabled` | Enable voice announcements | `true` or `false` |
| `ui.isLowVisionModeEnabled` | Enable low vision accessibility mode | `true` or `false` |
| `sonification.isSoniEnabled` | Enable sonification (audio representation) | `true` or `false` |
| `color.colorPalette` | Color palette name | `'default'`, `'accessible'`, etc. |
| `color.isDarkModeEnabled` | Enable dark color scheme | `true` or `false` |
| `legend.isDrawLegend` | Show chart legend | `true` or `false` |
| `controlPanel.isControlPanelDefaultOpen` | Control panel open by default | `true` or `false` |

## How Settings Work

Settings follow a hierarchical structure where each level represents a more specific configuration:

- **Top level**: `chart`, `axis`, `ui`, etc.
- **Second level**: `chart.title`, `axis.horiz`, `ui.speechRate`, etc.
- **Third level**: `chart.title.fontSize`, `axis.horiz.tick.labelFormat`, etc.

When you provide settings to a ParaChart element, they merge with the built-in defaults, allowing you to customize only the specific aspects you need while keeping sensible defaults for everything else.