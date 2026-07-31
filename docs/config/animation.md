# Animation Configuration

[Back to configuration](../config.md)

Chart animation timing and effects.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `animation.isAnimationEnabled` | Enable chart animations | `false` | boolean |
| `animation.animateRevealTimeMs` | Duration for main chart reveal animation in milliseconds | `2500` | number [0, 10000] |
| `animation.popInAnimateRevealTimeMs` | Duration for symbol pop-in animation in milliseconds | `750` | number |
| `animation.animationType` | Which axis to animate along | `"yAxis"` | 'yAxis' \| 'xAxis' \| 'none' |
| `animation.animationOrigin` | Starting point for animations | `"initialValue"` | [AnimationOrigin](#animationorigin) |
| `animation.animationOriginValue` | Custom value for animation origin when set to 'custom' | `0` | number [0, 10000] |

## Type Definitions

- <span id="animationorigin"></span>**AnimationOrigin**: 'baseline' \| 'top' \| 'initialValue' \| 'custom'
