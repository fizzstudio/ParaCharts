import { Logger, getLogger } from '../common/logger';

export type StyleManagerDeclarationValue = string | number | (() => string | number);

export class StyleManagerRule {
  protected _declarations = new Map<string, StyleManagerDeclarationValue>();

  constructor(protected _selector: string) {}

  get selector() {
    return this._selector;
  }

  set(keyValuePairs: Record<string, StyleManagerDeclarationValue>) {
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      this._declarations.set(key, value);
    });
  }

  toString() {
    return `${this._selector} {
${
  // [PARACHARTS_CHANGE] Wrap Map entries in Array.from, drop .toArray().
  Array.from(this._declarations.entries())
    .map(([key, value]) => `  ${key}: ${typeof value === 'function' ? value() : value.toString()};`)
    .join('\n')
}
}`;
  }

}

export class StyleManager {
  protected _rules = new Map<string, StyleManagerRule>();

  protected log: Logger;

  constructor(protected _stylesheet: CSSStyleSheet) {
    this.log = getLogger('styles');
  }

  set(selector: string, keyValuePairs: Record<string, StyleManagerDeclarationValue>) {
    let rule = this._rules.get(selector);
    if (!rule) {
      rule = new StyleManagerRule(selector);
      this._rules.set(selector, rule);
    }
    rule.set(keyValuePairs);
  }

  update() {
    // [PARACHARTS_CHANGE] Wrap Map values in Array.from so we can use .map/.filter.
    const matchIndices = Array.from(this._rules.values()).map(rule => {
      const selParts = rule.selector.split(' ');
      const regex = new RegExp(['^', ...selParts, '\\{'].join('\\s*'));
      return Array.from(this._stylesheet.cssRules).findIndex(cssRule =>
        cssRule.cssText.match(regex));
    }).filter(idx => idx !== -1); // [PARACHARTS_CHANGE] Remove bogus .toArray().

    matchIndices.sort().reverse().forEach(idx => {
      this.log.info('DEL', idx);
      this._stylesheet.deleteRule(idx);
    });

    // [PARACHARTS_CHANGE] Wrap Map values in Array.from before forEach.
    Array.from(this._rules.values()).forEach(rule => {
      this.log.info('INS', rule);
      this._stylesheet.insertRule(rule.toString());
    });
  }
}
