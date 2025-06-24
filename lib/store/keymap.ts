
import { type KeyRegistrations } from './keymap_manager';

export const keymap: KeyRegistrations = {
  v: {
    label: 'Toggle self-voicing mode',
    caseSensitive: false,
    action: 'voicingModeToggle'
  },
  b: {
    label: 'Toggle screen reader announcements',
    caseSensitive: false,
    action: 'announcementModeToggle'
  },
  s: {
    label: 'Toggle sonification mode',
    caseSensitive: false,
    action: 'sonificationModeToggle'
  },
  k: {
    label: 'Toggle dark mode',
    caseSensitive: false,
    action: 'darkModeToggle'
  },
  l: {
    label: 'Toggle low-vision mode',
    caseSensitive: false,
    action: 'lowVisionModeToggle'
  },
  h: {
    label: 'Show the help dialog',
    caseSensitive: false,
    action: 'openHelp'
  },
  ArrowRight: {
    label: 'Move right',
    action: 'moveRight'
  },
  ArrowLeft: {
    label: 'Move left',
    action: 'moveLeft'
  },
  ArrowUp: {
    label: 'Move up',
    action: 'moveUp'
  },
  ArrowDown: {
    label: 'Move down',
    action: 'moveDown'
  },
  'Shift+End': {
    label: 'Play datapoints to the right',
    action: 'playRight'
  },
  'Shift+Home': {
    label: 'Play datapoints to the left',
    action: 'playLeft'
  },
  'Ctrl+Control': {
    label: 'Stop playing',
    action: 'stopPlay'
  },
  // PageUp: {
  //   action: 'previous_stat'
  // },
  // PageDown: {
  //   action: 'next_stat'
  // },
  // 'Alt+PageUp': {
  //   action: 'first_category'
  // },
  // 'Alt+PageDown': {
  //   action: 'last_category'
  // },
  // 'Shift+PageDown': {
  //   action: 'play_forward_category'
  // },
  // 'Shift+PageUp': {
  //   action: 'play_backward_category'
  // },
  // Home: {
  //   action: 'first_point'
  // },
  // 'End': {
  //   action: 'last_point'
  // },
  // ' ': {
  //   label: 'Repeat last message',
  //   action: 'replay'
  // },
  Enter: {
    label: 'Select a datapoint',
    action: 'select'
  },
  'Shift+Enter': {
    label: 'Extend the datapoint selection',
    action: 'selectExtend'
  },
  u: {
    label: 'Clear the datapoint selection',
    caseSensitive: false,
    action: 'selectClear'
  },
  // a: {
  //   label: 'Add an annotation',
  //   caseSensitive: false,
  //   action: 'add_annotation'
  // },
  // 'Ctrl+ArrowLeft': {
  //   action: 'previous_tenth'
  // },
  // 'Ctrl+ArrowRight': {
  //   action: 'next_tenth'
  // },
  '[': {
    label: 'Go to the series minimum',
    action: 'goMinimum'
  },
  ']': {
    label: 'Go to the series maximum',
    action: 'goMaximum'
  },
  'Shift+{': {
    label: 'Go to the chart minimum',
    action: 'goTotalMinimum'
  },
  'Shift+}': {
    label: 'Go to the chart maximum',
    action: 'goTotalMaximum'
  },
  // t: {
  //   caseSensitive: false,
  //   action: 'speed_up'
  // },
  // r: {
  //   caseSensitive: false,
  //   action: 'slow_down'
  // },
  // m: {
  //   caseSensitive: false,
  //   action: 'monitor'
  // },
  // h: {
  //   caseSensitive: false,
  //   action: 'help'
  // },
  // o: {
  //   caseSensitive: false,
  //   action: 'options'
  // },
  q: {
    label: 'Query data',
    caseSensitive: false,
    action: 'queryData'
  },
  // w: {
  //   label: 'Describe series',
  //   action: 'describeSeries'
  // },
  // e: {
  //   label: 'Describe intersections',
  //   action: 'describeIntersections'
  // },
  c: {
    label: 'Toggle chord mode',
    caseSensitive: false,
    action: 'chordModeToggle'
  },
  'Ctrl+Shift+V': {
    label: 'Announce version info',
    action: 'announceVersionInfo'
  },
  Ctrl: {
    label: 'Stop speaking (self-voicing mode)',
    action: 'shutUp'
  },
  Escape: {
    label: 'Stop speaking (self-voicing mode)',
    action: 'shutUp'
  }
};
