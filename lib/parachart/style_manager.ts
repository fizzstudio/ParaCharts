
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

  constructor(protected _stylesheet: CSSStyleSheet) {}

  set(selector: string, keyValuePairs: Record<string, StyleManagerDeclarationValue>) {
    let rule = this._rules.get(selector);
    if (!rule) {
      rule = new StyleManagerRule(selector);
      this._rules.set(selector, rule);
    }
    rule.set(keyValuePairs);
  }

  update() {
    const matchIndices = this._rules.values().map(rule => {
      const selParts = rule.selector.split(' ');
      const regex = new RegExp(['^', ...selParts, '\\{'].join('\\s*'));
      return Array.from(this._stylesheet.cssRules).findIndex(cssRule =>
        cssRule.cssText.match(regex));
    }).filter(idx => idx !== -1).toArray();
    matchIndices.sort().reverse().forEach(idx => {
      console.log('DEL', idx);
      this._stylesheet.deleteRule(idx);
    });
    this._rules.values().forEach(rule => {
      console.log('INS', rule);
      this._stylesheet.insertRule(rule.toString());
    });
  }
}