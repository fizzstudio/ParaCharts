# Chart-Type Defaults

[Back to configuration](../config.md)

Some chart types override settings outside their own `type` group.

| Chart Type | Setting Path | Override |
|---|---|---|
{{#chartTypeDefaults}}
| {{chartType}} | `{{settingPath}}` | `{{value}}` |
{{/chartTypeDefaults}}
