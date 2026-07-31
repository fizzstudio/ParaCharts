# Defining Configuration Settings

[Back to configuration](../config.md)

Config descriptions are maintained in `lib/config/**/*.json`. A group can be represented by `<group>.json` or by `<group>/index.json`; additional JSON files beside an `index.json` define nested groups.

## Group Descriptors

These fields are generated from the public `ConfigGroupMetadata` interface:

| Field | Type | Description |
|---|---|---|
| `abstract?` | boolean | Whether the group is a reusable base omitted from the concrete config tree. |
| `description` | string | Human-readable group description used in generated documentation. |
| `family?` | string | Optional classification for related setting groups. |
| `ref?` | string | Dotted path of another group whose metadata is inherited. |
| `settings` | ConfigGroupSettingsMetadata | Setting descriptors keyed by setting name. |

## Setting Descriptors

These fields are generated from the public `ConfigSettingMetadata` interface. An inheriting source file may override only selected fields; required fields are present after inheritance is resolved. See the generated [`ConfigControlType` API reference](../api/paracharts.configcontroltype.md) for supported controls.

| Field | Type | Description |
|---|---|---|
| `advanced?` | boolean | Whether the setting is intended for advanced use. |
| `control?` | T | Control used to edit the setting, when it is exposed in the control panel. |
| `controlOptions?` | ConfigControlOptions | Options specific to the selected control. |
| `default` | ConfigSetting | Default setting value. |
| `description` | string | Human-readable description used in generated documentation. |
| `hidden?` | boolean | Whether the setting is hidden from generated settings documentation and controls. |
| `keywords?` | string[] | Search terms used to discover related setting metadata. |
| `label?` | string | Localized label key displayed in the control panel. |
| `panel?` | string | Control panel containing the setting. |
| `parentView?` | string | Dotted view path where the setting control is rendered. |
| `refresh?` | 'chart' \| 'description' | Content that must be refreshed after the setting changes. |
| `type` | string | Stringified TypeScript type used to generate the config interface. |

## Generated Artifacts

After editing descriptors, run:

```sh
python3 lib/config/build_settings.py lib/config
```

This generates:

- `config_types.ts`: the typed config hierarchy, with doc comments copied from descriptions.
- `config_defaults.ts`: the fully resolved default tree.
- `config_metadata.ts`: runtime descriptors with `ref` inheritance resolved.

Do not edit generated config files directly. The generator warns about settings without descriptions.

## Internal Updates

`ParaState.config` is treated as immutable. Internal code changes one or more settings through `ParaState.updateConfig()`, which uses an Immer draft and then assigns the new tree. Each changed path is propagated through `settingDidChange()` so views and other observers can react.

Use `SettingsManager.get()` and `SettingsManager.set()` internally when a setting is identified by a dotted path rather than normal property access.
