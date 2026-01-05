//import type { translateEvaluators } from './translations';

import { Logger, getLogger } from '../common/logger';

import { ActionMap, ActionArgumentMap, HotkeyWithArgument } from './action_map';

interface BaseKeyDetails {
  /**
   * String representing a key to be struck, possibly with modifiers held down.
   * The key itself is the same string returned in the `key` property of
   * a `KeyboardEvent`. Supported modifiers are `Alt`, `Ctrl`, and `Shift`.
   * If any of the modifiers are to be pressed, they must appear before the
   * string specifying the key, followed by a `+`, in the above order. E.g.,
   *   Alt+Shift+ArrowRight
   *   Ctrl+Home
   *   Alt+q
   */
  key: string;
  /**
   * Used for generating descriptions of non-printing keys (e.g., 'spacebar' for ' ').
   */
  keyDescription?: string;
  /** Additional description for what this hotkey does (displayed in hotkey dialog) */
  description?: string;
  /** ID of action to associate with this hotkey. */
  action: string;
  args?: ActionArgumentMap;
}

/**
 * Details for a given hotkey
 */
export interface KeyDetails extends BaseKeyDetails {
  /* Title for what this hotkey does (displayed in hotkey dialog) */
  title?: string;
}

export class HotkeyEvent extends Event {
  constructor(
    public readonly key: string,
    public readonly action: string,
    public readonly args?: ActionArgumentMap
  ) {
    super('hotkeypress', {bubbles: true, cancelable: true, composed: true});
  }
}

/**
 * Keyboard event manager enables:
 * - registering/unregistering custom keyboard events
 * - generating documentations listing keyboard events
 * @internal
 */
export class KeymapManager extends EventTarget {
  protected log: Logger = getLogger("KeymapManager");  
  protected _keyDetails: {
    [keyId: string]: KeyDetails;
  } = {};

  constructor(actionMap: ActionMap) {
    super();
    this.registerHotkeys(actionMap);
  }

  /**
   * Register a hotkey.
   * @param keyInfo - the key ID string or key with args object
   * @param action - the action to perform if the key is pressed
   */
  registerHotkey(keyInfo: string | HotkeyWithArgument, action: string) {
    const keyId = typeof keyInfo === 'string' ? keyInfo : keyInfo.keyID;
    try {
      this._keyDetails[keyId] = {
        key: keyId,
        //title: this.todo.controller.translator.translate(titleId),
        //description,
        action,
        //keyDescription
      };
      if (typeof keyInfo !== 'string') {
        this._keyDetails[keyId].args = keyInfo.args;
      }
      if (keyId.length === 1 && keyId.toLocaleUpperCase() !== keyId) {
        this._keyDetails[`Shift+${keyId}`] = {
          key: keyId,
          //title: this.todo.controller.translator.translate(titleId),
          //description,
          action,
          //keyDescription
        };
      }
    } catch (e) {
      if (e instanceof Error) {
        this.log.warn(e.message);
      }
    }
  }

  /**
   * Register multiple hotkeys.
   * Effectively a shortcut to calling `.registerHotkey()` multiple times
   * @param keyRegistrations - hotkey registration info
   */
  registerHotkeys(actionMap: ActionMap) {
    for (const [action, info] of Object.entries(actionMap)) {
      for (const hotkeyInfo of info.hotkeys) {
        this.registerHotkey(hotkeyInfo, action);
      }
    }
  }

  onKeydown(key: string) {
    const details = this._keyDetails[key];
    if (details) {
      this.dispatchEvent(new HotkeyEvent(key, details.action, details.args));
      return true;
    }
    return false;
  }

}
