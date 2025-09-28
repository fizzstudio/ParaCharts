# Accessibility Features

Paracharts is designed with accessibility at its core, offering features that go beyond standard keyboard navigation and screen reader support.
These features are not only valuable for users of screen readers, but are also essential for voice-based interfaces such as smart speakers and smart glasses, where visual access to data is limited or unavailable.

## Screen Reader Support

Paracharts provides semantic markup and ARIA attributes, enabling screen readers to accurately convey chart structure, data, and context.
This ensures users with visual impairments can understand and interact with charts effectively.

## Self-Voicing Mode

In addition to screen reader support, Paracharts offers a built-in self-voicing mode. When enabled, this feature allows the chart to speak its content and updates directly, using the browser's speech synthesis capabilities. This is especially valuable for users who do not use a traditional screen reader, or for hands-free and eyes-free scenarios such as smart glasses, kiosks, or voice-first devices.

To toggle self-voicing mode, press the `v` key while the chart is focused. Once enabled, all chart announcements, descriptions, and navigation feedback will be spoken aloud automatically. You can stop the speech at any time by pressing either the `Ctrl` key or the `Escape` key.

Self-voicing mode works in tandem with other accessibility features, such as sonification and AI-powered descriptions, to provide a rich, multimodal experience for all users.

## Sonification

A key challenge with traditional chart accessibility is that serial navigation, which moves through data point by point, can be slow and overwhelming.
This makes it difficult to grasp overall trends or patterns.
Paracharts addresses this by translating chart data into audio cues.
Sonification allows users to perceive the shape, direction, and outliers in data through sound, providing an immediate sense of the data’s structure that would otherwise require extensive navigation.
This approach is especially useful for voice-based platforms, where audio is the primary mode of interaction.

When a chart is focused, use `s` shortcut to toggle sonification mode.
After enabling sonification mode, from the beginning of the chart, press the left arrow key to hear all of the points in the chart sonified in sequence.
When arrowing through the chart point by point, sonification mode also gives users immediate audio feedback of the value of that particular point.

## AI-Powered Descriptions

Paracharts uses AI to generate concise, context-aware textual summaries of charts.
These descriptions highlight key insights, trends, and anomalies, giving users a quick overview of the data.
This helps users understand the main points without needing to examine each data point individually, making data more accessible to those who rely on screen readers, voice assistants, or prefer text-based information.

The chart descriptions are updated dynamically as chart elements are focused.
These updates are located in an ARIA live region, making them easily accessible for screen reader users.
Additionally, when self-voicing mode is enabled, the updated descriptions are sent directly to the built-in speech engine.
When an individual point in a chart is focused, the `Q` command can be used to query that point, updating its description to contain more detail.
