# Accessibility Features

ParaCharts is designed with accessibility at its core. This page explains the practical controls users can use to make charts easier to perceive and navigate.

## What you can do (quick)

- Enable/disable sonification: press `s` when the chart is focused.
- Toggle self-voicing (text-to-speech): press `v` when the chart is focused.
- Query a focused point for a detailed description: press `Q`.
- Access the latest AI-generated summary in the ARIA live region (announced automatically when updated).

## Screen reader behavior

ParaCharts provides semantic markup and ARIA attributes so screen readers can announce chart summaries, updates, and focused points. When a chart or element is focused, the chart updates an ARIA live region with a short description.

Practical tips:

- If you want a quick overview, focus the chart and wait for the AI summary to be announced.
- To hear details for a data point, focus the point and press `Q`.
- If announcements are too frequent, toggle self-voicing off or reduce live-region verbosity in your app settings.

## Sonification (audio representation of data)

Sonification translates data values into sound to give an immediate sense of trends and outliers.

How to use it:

- Focus the chart and press `s` to toggle sonification mode.
- Use the arrow keys to step through points and hear their values.
- From the start of the series, press the left arrow to play points in sequence.

What to expect:

- Pitch generally maps to value (higher = higher pitch).
- Additional audio cues may indicate series boundaries or outliers.

## Self-voicing and AI descriptions

Self-voicing mode uses the browser's speech synthesis to read chart announcements and AI summaries automatically.

- Toggle: press `v` while the chart is focused.
- While enabled, AI summaries and important announcements are spoken automatically.
- For a point-level description, focus the point and press `Q` to request more detail.

## Troubleshooting (audio & screen reader)

- No sound: ensure your device volume and browser audio permissions are enabled.
- Announcements not heard: check that a screen reader or self-voicing mode is active and the browser focus is on the chart.
- Sonification too fast/slow: look for playback speed controls in the control panel (or use keyboard shortcuts if provided).
