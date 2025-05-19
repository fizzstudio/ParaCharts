
import { type KeyRegistrations } from './keymap_manager';

export const keymap: KeyRegistrations = {
  v: {
    label: 'Toggle self-voicing mode',
    caseSensitive: false,
    action: 'voicing_mode_toggle'
  },
  b: {
    label: 'Toggle screen reader announcements',
    caseSensitive: false,
    action: 'announcement_mode_toggle'
  },
  s: {
    label: 'Toggle sonification mode',
    caseSensitive: false,
    action: 'sonification_mode_toggle'
  },
  k: {
    label: 'Toggle dark mode',
    caseSensitive: false,
    action: 'dark_mode_toggle'
  },
  l: {
    label: 'Toggle low-vision mode',
    caseSensitive: false,
    action: 'low_vision_mode_toggle'
  },
  h: {
    label: 'Show the help dialog',
    caseSensitive: false,
    action: 'open_help'
  },
  ArrowRight: {
    label: 'Move right',
    action: 'move_right'
  },
  ArrowLeft: {
    label: 'Move left',
    action: 'move_left'
  },
  ArrowUp: {
    label: 'Move up',
    action: 'move_up'
  },
  ArrowDown: {
    label: 'Move down',
    action: 'move_down'
  },
  'Shift+End': {
    label: 'Play datapoints to the right',
    action: 'play_right'
  },
  'Shift+Home': {
    label: 'Play datapoints to the left',
    action: 'play_left'
  },
  'Ctrl+Control': {
    label: 'Stop playing',
    action: 'stop_play'
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
  ' ': {
    label: 'Repeat last message',
    action: 'replay'
  },
  Enter: {
    label: 'Select a datapoint',
    action: 'select'
  },
  'Shift+Enter': {
    label: 'Extend the datapoint selection',
    action: 'select_extend'
  },
  u: {
    label: 'Clear the datapoint selection',
    caseSensitive: false,
    action: 'select_clear'
  },
  a: {
    label: 'Add an annotation',
    caseSensitive: false,
    action: 'add_annotation'
  },
  // 'Ctrl+ArrowLeft': {
  //   action: 'previous_tenth'
  // },
  // 'Ctrl+ArrowRight': {
  //   action: 'next_tenth'
  // },
  '[': {
    label: 'Go to the series minimum',
    action: 'go_minimum'
  },
  ']': {
    label: 'Go to the series maximum',
    action: 'go_maximum'
  },
  'Shift+{': {
    label: 'Go to the chart minimum',
    action: 'go_total_minimum'
  },
  'Shift+}': {
    label: 'Go to the chart maximum',
    action: 'go_total_maximum'
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
    action: 'query_data'
  },
  w: {
    label: 'Describe series',
    action: 'describe_series'
  },
  e: {
    label: 'Describe intersections',
    action: 'describe_intersections'
  },
  c: {
    label: 'Toggle chord mode',
    caseSensitive: false,
    action: 'chord_mode_toggle'
  }
};
