
import { type KeyRegistrations } from './keymap_manager';

export const keymap: KeyRegistrations = {
  v: {
    caseSensitive: false,
    action: 'voicing_mode_toggle'
  },
  b: {
    caseSensitive: false,
    action: 'announcement_mode_toggle'
  },
  s: {
    caseSensitive: false,
    action: 'sonification_mode_toggle'
  },
  k: {
    caseSensitive: false,
    action: 'dark_mode_toggle'
  },
  l: {
    caseSensitive: false,
    action: 'low_vision_mode_toggle'
  },
  h: {
    caseSensitive: false,
    action: 'open_help'
  },
  ArrowRight: {
    action: 'move_right'
  },
  ArrowLeft: {
    action: 'move_left'
  },
  ArrowUp: {
    action: 'move_up'
  },
  ArrowDown: {
    action: 'move_down'
  },
  'Shift+End': {
    action: 'play_right'
  },
  'Shift+Home': {
    action: 'play_left'
  },
  'Ctrl+Control': {
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
    action: 'replay'
  },
  Enter: {
    action: 'select'
  },
  'Shift+Enter': {
    action: 'select_extend'
  },
  u: {
    caseSensitive: false,
    action: 'select_clear'
  },
  a: {
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
    action: 'go_minimum'
  },
  ']': {
    action: 'go_maximum'
  },
  'Shift+{': {
    action: 'go_total_minimum'
  },
  'Shift+}': {
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
    caseSensitive: false,
    action: 'query_data'
  },
  'Shift+h': {
    action: 'play_right'
  },
  'w': {
    action: 'describe_series'
  },
  'e': {
    action: 'describe_intersections'
  },
  c: {
    caseSensitive: false,
    action: 'chord_mode_toggle'
  }
};
