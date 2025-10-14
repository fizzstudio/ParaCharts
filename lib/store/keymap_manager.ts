//import type { translateEvaluators } from './translations';

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
}

/**
 * Details for a given hotkey
 */
export interface KeyDetails extends BaseKeyDetails {
  /* Title for what this hotkey does (displayed in hotkey dialog) */
  title?: string;
}

export class HotkeyEvent extends Event {
  constructor(public readonly key: string, public readonly action: string) {
    super('hotkeypress', {bubbles: true, cancelable: true, composed: true});
  }
}

/**
 * Associate a key event with an action.
 */
// export interface KeyRegistration extends BaseKeyDetails {
//   /** ID of title for what this hotkey does (displayed in hotkey dialog). */
//   titleId: string;
//   /** If the hotkey already exists, force this command to override it. */
//   force?: boolean;
//   /** If the hotkey should be case sensitive. Default true. */
//   caseSensitive?: boolean;
// }

import { type HotkeyActions } from '../paraview/hotkey_actions';

/**
 * Associates a key event with an action.
 */
export interface KeyRegistration {
  label: string;
  /** ID of action to associate with this hotkey. */
  action: keyof HotkeyActions['actions'];
  /** If the hotkey should be case sensitive. Default true. */
  caseSensitive?: boolean;
}

export interface KeyRegistrations {
  [key: string]: KeyRegistration;
}

/**
 * Keyboard event manager enables:
 * - registering/unregistering custom keyboard events
 * - generating documentations listing keyboard events
 * @internal
 */
export class KeymapManager extends EventTarget {
  private keyDetails: {
    [keyId: string]: KeyDetails;
  } = {};

  constructor(registrations: KeyRegistrations) {
    super();
    this.registerHotkeys(registrations);
  }

  /**
   * Handle the keydown event
   * @param event - keydown event
   */
  // handleKeyEvents(event: CustomEvent) {
  //   if (event.detail in this._keymap) {
  //     this.view.actionManager!.call(this._keymap[keyPress].action);
  //   } else if (keyPress.toUpperCase() in this._keymap) {
  //     this.view.actionManager!.call(this._keymap[keyPress.toUpperCase()].action);
  //   }
  // }

  /**
   * Register a hotkey.
   * @param keyId - the key ID string
   * @param details - the details of the key event
   * @param details.action - the action to perform if the key is pressed
   * @param details.caseSensitive - should the keypress be case sensitive?
   */
  registerHotkey(keyId: string, {
    action,
    caseSensitive = true
  }: KeyRegistration) {
    if (keyId in this.keyDetails) {
      console.log('overriding key binding for', keyId);
    }
    try {
      this.keyDetails[keyId] = {
        key: keyId,
        //title: this.todo.controller.translator.translate(titleId),
        //description,
        action,
        //keyDescription
      };
      if (keyId.length === 1 && keyId.toLocaleUpperCase() !== keyId) {
        this.keyDetails[`Shift+${keyId}`] = {
          key: keyId,
          //title: this.todo.controller.translator.translate(titleId),
          //description,
          action,
          //keyDescription
        };
      }
    } catch (e) {
      if (e instanceof Error) {
        console.warn(e.message);
      }
    }
  }

  /**
   * Register multiple hotkeys.
   * Effectively a shortcut to calling `.registerHotkey()` multiple times
   * @param keyRegistrations - hotkey registration info
   */
  registerHotkeys(keyRegistrations: KeyRegistrations) {
    for (const [key, reg] of Object.entries(keyRegistrations)) {
      this.registerHotkey(key, reg);
    }
  }

  actionForKey(key: string): string | undefined {
    return this.keyDetails[key]?.action;
  }

  onKeydown(key: string) {
    const action = this.actionForKey(key);
    if (action) {
      this.dispatchEvent(new HotkeyEvent(key, action));
      return true;
    }
    return false;
  }

  /**
   * Build a help dialog
   * @param lang Language of the dialog - used in attribute, and for i18n
   * @param translationCallback - get language-specific verbiage
   */
  /*generateHelpDialog(
    lang: string,
    translationCallback: (
      code: string,
      //evaluators?: translateEvaluators
    ) => string
  ) {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("lang", lang);

    const closeButton = document.createElement("button");
    closeButton.textContent = 'X';
    closeButton.ariaLabel = translationCallback("close");
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.addEventListener("click", () => {
      dialog.close();
    });
    dialog.appendChild(closeButton);

    const heading = translationCallback("kbmg-title");
    const h1 = document.createElement("h1");
    h1.textContent = heading;
    dialog.setAttribute("aria-live", heading);
    dialog.appendChild(h1);

    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    Object.entries(this._keyMap).forEach(([keystroke, details]) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = 'row';
      th.textContent = details.title;
      tr.appendChild(th);

      const td1 = document.createElement("td");
      td1.textContent = details.keyDescription ?? keystroke;
      tr.appendChild(td1);

      const td2 = document.createElement("td");
      td2.textContent = details.description;
      tr.appendChild(td2);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    dialog.appendChild(table);
    return dialog;
  }*/

  /**
   * Launch help dialog
   * @param lang Language of the dialog - used in attribute, and for i18n
   * @param translationCallback - get language-specific verbiage
   */
  /*launchHelpDialog(
    lang: string,
    translationCallback: (
      code: string,
      evaluators?: translateEvaluators
    ) => string
  ) {
    if (this._dialog === null) {
      this._dialog = this.generateHelpDialog(lang, translationCallback);
      document.body.appendChild(this._dialog);
    }
    this._dialog.showModal();
    this._dialog.focus();
  }*/
}
