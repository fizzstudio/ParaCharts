# ParaAPI

Perform various operations on a ParaChart.

### get actions



### addCrosshair(xAxis, yAxis)



### addRecord(pushPoints)

Add a record to the end of the chart and remove the first record.

### addTrendLine()



### get chartInfo



### clearAllDatapointHighlights()

Clear all datapoint highlights.

### clearAllHighlights()

Clear all chart highlights.

### clearAllIntersectionHighlights()

Clear all series intersection highlights.

### clearAllPopups()

Clear all chart highlights.

### clearAllRangeHighlights()

Clear all chart horizontal range highlights.

### clearAllSequenceHighlights()

Clear all sequence highlights.

### clearAllSeriesHighlights()

Clear all series highlights.

### clearCrosshair(xAxis, yAxis)



### clearEastLegendHighlight()

Clear any chart east legend highlight.

### clearHorizontalAxisHighlight()

Clear any chart horizontal axis highlight.

### clearIntersectionHighlight(index)

Clear any series intersection highlight.

### clearNorthLegendHighlight()

Clear any chart north legend highlight.

### clearRangeHighlight(startPortion, endPortion)

Clear a chart horizontal range highlight.

### clearSelected()



### clearSouthLegendHighlight()

Clear any chart south legend highlight.

### clearTitleHighlight()

Clear any chart title highlight.

### clearVerticalAxisHighlight()

Clear any chart vertical axis highlight.

### clearVisited()



### clearWestLegendHighlight()

Clear any chart west legend highlight.

### disableTourGuideActions()

Enable the standard hotkey actions.

### doAction(action, args)

Perform a hotkey action.

### downloadPNG()

Download the chart in PNG format.

### downloadSVG()

Download the chart in SVG format.

### enableTourGuideActions()

Enable the hotkey actions for tour guide mode.

### getAllConfigSettings()

Get all settings.

### getAltText()

Get the chart alt text.

### getConfigGroupMetadata(path)

Get config group metadata.

### getConfigSetting(settingPath)

Get a setting.

### getConfigSettings(settingPaths)

Get multiple settings.

### getConfigSettingsMetadata(keywords)

Get config settings metadata matching all given keywords.

### getCustomProperties()

Return all  CSS custom properties found in the page's stylesheets, as a flat dot-path map (e.g. ). Useful for debugging and verifying which CSS properties are being picked up.

### getDescription()

Get the chart description.

### getHorizontalAxis()

Get the chart horizontal axis.

### getIntersection(index)

Get an intersection between two or more series.

### getJIM()

Get the chart JIM.

### getLegend(location)

Get a chart legend.

### getRange(startPortion, endPortion)

Get a horizontal range of the chart.

### getSeries(seriesLabelsOrKeys)

Get one or more series to operate on.

### getShortDescription()

Get the chart short description.

### getTitle()

Get the chart title label.

### getVerticalAxis()

Get the chart vertical axis.

### hideAllSeries()

Hide all chart series.

### highlightCluster(clusterID)



### highlightEastLegend()

Highlight the chart east legend.

### highlightHorizontalAxis()

Highlight the chart horizontal axis.

### highlightIntersection(index)

Highlight an intersection between series.

### highlightNorthLegend()

Highlight the chart north legend.

### highlightRange(startPortion, endPortion)

Highlight a horizontal range of the chart.

### highlightSouthLegend()

Highlight the chart south legend.

### highlightTitle()

Highlight the chart title.

### highlightVerticalAxis()

Highlight the chart vertical axis.

### highlightWestLegend()

Highlight the chart west legend.

### get paraChart



### refresh()



### registerBrailleTranslationProvider(provider)

Register and initialize the literary Braille translator used by this chart. Await this method before loading a tactile manifest that uses Braille labels.

### removeRecord(unshiftPoints)

Remove the last record from the chart and add a new record to the start.

### removeTrendLine()



### serializeChart()

Get the serialized SVG version of the chart.

### setConfigSetting(settingPath, value)

Set a setting.

### setConfigSettings(settingsInput)

Set multiple settings.

### setHeight(height)

Set chart height.

### setManifest(manifestUrl)

Set the chart manifest.

### setSize(width, height)

Set chart width and height.

### setWidth(width)

Set chart width.

### unhideAllSeries()

Unhide all chart series.

### waitForManifest()

Wait for a manifest to be loaded. Resolves immediately if already loaded.

