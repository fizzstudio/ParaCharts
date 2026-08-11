# Chart-Type Configuration

[Back to configuration](../config.md)

Chart type-specific settings are split by chart type or internally composed chart model.

| Chart Type / Model | Description | Settings |
|---|---|---:|
{{#typeGroups}}
| [{{displayName}}]({{link}}) | {{description}} | {{settingCount}} |
{{/typeGroups}}

## Shared Settings

Some supported chart types reuse another chart type's settings rather than defining a separate group.

| Chart Type | Settings Group |
|---|---|
{{#chartTypeAliases}}
| `{{chartType}}` | {{#hasSettingsGroup}}[{{settingsGroup}}]({{settingsLink}}){{/hasSettingsGroup}}{{^hasSettingsGroup}}No dedicated settings group{{/hasSettingsGroup}} |
{{/chartTypeAliases}}
