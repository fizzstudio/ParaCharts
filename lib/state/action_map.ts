

export interface AvailableActions {
  move(direction: string): Promise<void>;
  goFirst(): void;
  goLast(): void;
  goMinimum(): void;
  goMaximum(): void;
  goTotalMinimum(): void;
  goTotalMaximum(): void;
  switchToOtherData(): void;
  select(): void;
  extendSelection(): void;
  clearSelection(): void;
  playRight(): void;
  playLeft(): void;
  stopPlay(): void;
  queryData(): void;
  toggleSonificationMode(): void;
  toggleTrendNavigationMode(): void;
  toggleAnnouncementMode(): void;
  toggleVoicingMode(): void;
  toggleDarkMode(): void;
  toggleLowVisionMode(): void;
  openHelp(): void;
  openExplainer(): void;
  announceVersionInfo(): void;
  jumpToChordLanding(): void;
  shutUp(): void;
  repeatLastAnnouncement(): void;
  addAnnotation(): void;
  toggleNarrativeHighlightMode(noSelfVoicing: boolean): void;
  toggleDataTable(): void;
  playPauseMedia(): void;
  reset(): void;
}

/**
 * Associates a key event with an action.
 */
export interface ActionInfo {
  label: string;
  hotkeys: (string | HotkeyWithArgument)[];
  parameters?: ActionParameterMap;
  subactions?: Subaction[];
}

export interface HotkeyWithArgument {
  keyID: string;
  args: ActionArgumentMap;
}

export interface ActionArgumentMap {
  [name: string]: number | string | boolean;
}

export interface ActionParameterMap {
  [name: string]: ActionParameterType;
}

export type ActionParameterType = 'number' | 'string' | 'boolean';

export interface Subaction {
  action: keyof AvailableActions;
  arguments?: SubactionArgument[];
}

export interface SubactionArgument {
  name: string;
  value: number | string;
}

export type ActionMap = {
  [Property in keyof AvailableActions]: ActionInfo;
};

import actionMapJson from './action_map.json' with { type: 'json' };

export const actionMap: ActionMap = actionMapJson as ActionMap;

