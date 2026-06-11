import { Logger, getLogger } from '@fizz/logger';

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
  this._declarations.entries()
    .map(([key, value]) => `  ${key}: ${typeof value === 'function' ? value() : value.toString()};`)
    .toArray()
    .join('\n')
}
}`;
  }

}

export class StyleManager {
  protected _rules = new Map<string, StyleManagerRule>();
  private log: Logger = getLogger("StyleManager");
  protected _stylesheet: CSSStyleSheet;
  constructor() {
    this._stylesheet = new CSSStyleSheet();
  }

  get stylesheet(): CSSStyleSheet {
    return this._stylesheet;
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
    const text = this._rules.values().map(rule => rule.toString()).toArray().join('\n');
    this._stylesheet.replaceSync(text);
  }
}