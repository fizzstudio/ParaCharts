import { type ConfigSetting } from './config_types';

/** Controls available for editing configuration settings.
 * @public
 */
export type ConfigControlType = 'textfield' | 'dropdown' | 'checkbox' | 'radio' | 'slider' | 'button';

/** Control-specific configuration options.
 * @public
 */
export interface ConfigControlOptions {
  /** HTML input type used by text fields. */
  inputType?: 'number' | 'text' | 'color';
  /** Minimum numeric value. */
  min?: number;
  /** Maximum numeric value. */
  max?: number;
  /** Additional options understood by the selected control. */
  [option: string]: unknown;
}

/** Metadata describing one fully resolved configuration setting.
 * @public
 */
export interface ConfigSettingMetadata<T extends ConfigControlType = ConfigControlType> {
  /** Localized label key displayed in the control panel. */
  label?: string;
  /** Human-readable description used in generated documentation. */
  description: string;
  /** Stringified TypeScript type used to generate the config interface. */
  type: string;
  /** Default setting value. */
  default: ConfigSetting;
  /** Control used to edit the setting, when it is exposed in the control panel. */
  control?: T;
  /** Options specific to the selected control. */
  controlOptions?: ConfigControlOptions;
  /** Whether the setting is intended for advanced use. */
  advanced?: boolean;
  /** Control panel containing the setting. */
  panel?: string;
  /** Dotted view path where the setting control is rendered. */
  parentView?: string;
  /** Whether the setting is hidden from generated settings documentation and controls. */
  hidden?: boolean;
  /** Search terms used to discover related setting metadata. */
  keywords?: string[];
  /** Content that must be refreshed after the setting changes. */
  refresh?: 'chart' | 'description';
}

/** Metadata describing a configuration group.
 * @public
 */
export interface ConfigGroupMetadata {
  /** Human-readable group description used in generated documentation. */
  description: string;
  /** Optional classification for related setting groups. */
  family?: string;
  /** Dotted path of another group whose metadata is inherited. */
  ref?: string;
  /** Whether the group is a reusable base omitted from the concrete config tree. */
  abstract?: boolean;
  /** Setting descriptors keyed by setting name. */
  settings: ConfigGroupSettingsMetadata;
}

/** Setting descriptors keyed by dotted setting path or local setting name.
 * @public
 */
export interface ConfigGroupSettingsMetadata {
  /** Resolved metadata for a setting. */
  [settingName: string]: ConfigSettingMetadata | undefined;
}

/** Configuration group metadata keyed by dotted group path.
 * @public
 */
export interface ConfigMetadata {
  /** Resolved metadata for a config group. */
  [groupPath: string]: ConfigGroupMetadata | undefined;
}
