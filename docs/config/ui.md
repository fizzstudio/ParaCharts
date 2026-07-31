# UI Configuration

[Back to configuration](../config.md)

User interface and accessibility features.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `ui.isVoicingEnabled` | Enable voice output for screen reader users | `false` | boolean |
| `ui.isTourGuideEnabled` | Enable visual highlighting when narrative elements are announced | `false` | boolean |
| `ui.isTourGuidePaused` | Pause Tour Guide | `false` | boolean |
| `ui.isAnnouncementEnabled` | Enable aria-live announcements | `true` | boolean |
| `ui.speechRate` | Self-voicing speech rate. Range: 0.5 to 2 | `1` | number [0.5, 2] |
| `ui.liveUpdateDelay` | Delay in seconds between live update announcements | `1` | number |
| `ui.isFullscreenEnabled` | Enable fullscreen mode | `false` | boolean |
| `ui.isLowVisionModeEnabled` | Enable low vision accessibility enhancements | `false` | boolean |
| `ui.lowVisionFontScale` | *Font scale multiplier to apply when low-vision mode is enabled* † | `2` | number |
| `ui.lowVisionIsVertGridlines` | *Enable vertical gridlines when low-vision mode is enabled* † | `true` | boolean |
| `ui.lowVisionDisableAnimations` | *Disable animations when low-vision mode is enabled* † | `true` | boolean |
| `ui.lowVisionIsFullscreen` | *Enable fullscreen when low-vision mode is enabled* † | `true` | boolean |
| `ui.isFocusRingEnabled` | *Show focus ring around active elements* † | `false` | boolean |
| `ui.focusRingGap` | *Gap size around focus ring in pixels* † | `10` | number |
| `ui.navRunTimeoutMs` | *Timeout in milliseconds for navigation runs* † | `125` | number |

