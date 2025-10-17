# Control Panel & Settings

The ParaCharts control panel groups UI and accessibility options into a set of tabs. Each tab focuses on related controls so you can quickly find and change the behavior or appearance of a chart. Below you will find one short section per tab describing what that tab does and the most useful actions for end users.

## Audio

The Audio tab contains settings that control how charts produce sound and spoken output. Use these when you want to enable audible exploration (sonification) or control automatic speech announcements and their verbosity.

- Toggle Sonification (button): turn sonification mode on/off for the focused chart; when on, arrow keys or playback controls will play point values as audio.
- Self-voicing (toggle): enable automatic speech of AI summaries and important announcements without requiring a screen reader.
- Announcements (toggle): control whether chart updates post to the ARIA live region for screen readers.
- Sonification Controls (dialog): opens a dialog where you can set playback speed, choose riff modes, and control how series are mapped to pitch.

## Chart

The Chart tab groups presentation options that affect the whole chart: titles, layout, legend, and how series are drawn. These controls are useful when you want to tune the visual presentation for readability or embedding.

- Legend (toggle): show or hide the chart legend.
- Title & Subtitle (inputs): edit the chart title and subtitle text and set alignment.
- Orientation (select): choose chart orientation where supported (e.g., bar vs. column), changing axis layout.
- Symbols (toggle): enable or disable point symbols on series lines.
- Label placement (select): choose whether labels appear inside/outside bars or near series points.

## Colors

The Colors tab focuses on color selection and contrast to improve clarity and accessibility. Use it to change series palettes, tweak contrast, or enable color-vision modes for users with color deficiencies.

- Palette (select): choose a predefined color palette for series colors.
- Contrast (slider/select): increase or decrease UI/chart contrast for readability.
- Color Vision Mode (select): apply presets for Deutan, Protan, Tritan, or Grayscale to simulate or compensate for color-vision differences.
- Custom Colors (picker/inputs): (if enabled) edit individual series colors or paste a palette.

## Controls

The Controls tab contains UI-level toggles and access to utility dialogs such as keyboard mappings and advanced settings. It's the place to change how the control panel behaves and to find keyboard/interaction helpers.

- Default panel open (toggle): set whether the control panel should be open by default when a chart loads.
- Keyboard Controls (button/dialog): open a dialog that lists keyboard shortcuts and (when supported) allows remapping.
- Fullscreen (button/toggle): enter or exit fullscreen chart view.
- Advanced Controls (button): open a dialog exposing lower-level settings for power users.

## Data

The Data tab is where you inspect, import, and configure the dataset behind the chart. Use it to validate data in a table, upload or link new sources, and tweak parsing settings.

- Open Table (button): open an interactive table view of the current dataset for inspection and selection.
- Import Data (button): upload CSV/JSON files or connect to external data sources (if the feature is enabled).
- Parsing Options (controls): choose date formats, separators, and column type hints used when importing.
- Export Data (button): download the currently visible dataset as CSV.

## Description

The Description tab manages captions and AI-generated textual summaries that explain the chart. These settings control whether descriptions are shown, how they update, and whether they are announced.

- Caption (textarea/input): edit the static caption text that appears with the chart.
- AI Summary (button): request or refresh an AI-generated description of the current view (filters and selections affect the result).
- Auto-announce (toggle): control whether descriptions are posted to the ARIA live region automatically.
- Caption placement (select): choose whether the caption is inside the control panel or external to the chart frame.

## Annotations

The Annotations tab contains tools for adding, editing, and managing notes and callouts on the chart. Annotations help highlight important points or ranges for presentation and collaboration.

- Add Annotation (button): add point, range, or free-text annotations to the chart.
- Annotation List (panel): view and toggle visibility for existing annotations.
- Edit Annotation (dialog): change annotation text, style, and target coordinates.
- Remove Annotation (button): delete an annotation.

## Graphing

The Graphing tab exposes tools for plotting mathematical functions or applying graphing presets. It is typically used in educational or analysis contexts where equations or continuous functions are visualized.

- Presets (select): choose a predefined graphing preset (sine, polynomial, exponential, etc.).
- Custom Equation (input): enter a formula to plot; provide parameter controls when available.
- Sampling (slider): control sample density for plotted functions.
- Axis Options (controls): set axis ranges, labels, and scaling.

## Analysis

The Analysis tab provides quick data-inspection tools that compute summaries, detect outliers, and suggest interesting trends. Results are typically brief and aimed at guiding further exploration.

- Run Analysis (button): execute built-in analyses like trend detection and outlier finding on the current dataset.
- Summary Panel (panel): view computed summaries (mean, median, trend direction) and quick insights.
- Export Report (button): download a brief analysis report or copy a summary to the clipboard.
