import { Logger, getLogger } from '../common/logger';
import { type SettingsInput } from '../store/settings_types';
import { Colors, Color, Palette } from '../common/colors';
import { type DataSymbolType, type DataSymbolShape, type DataSymbolFill } from '../view/symbol';
import { type ParaStore } from './parastore';

export class CustomPropertyLoader {
  _customPrefix = '--para-';
  // paraRules are structured as an object of objects with
  //  selectors as the keys of objects with their style properties as key-value pairs
  _paraRules: Record<string, Record<string, string>> = {};
  _colorPalette: Palette | null = null;
  _symbolSet: DataSymbolType[] | null = null;

  protected _store!: ParaStore;

  protected log: Logger = getLogger("CustomPropertyLoader");  
  
  get store() {
    return this._store;
  }

  set store(store: ParaStore) {
    this._store = store;
  }

  // Convert `paraRules` to object of key-value pairs of type SettingInput
  processProperties() {
    this._getParaRules();
    const result: SettingsInput = {};

    Object.keys(this._paraRules).forEach(selector => {
      const settingGroup = selector.replace(/\s+/g, '').substring(1);
      const props = this._paraRules[selector];
      this.log.info(selector, props);
      Object.keys(props).forEach(prop => {
        const value = props[prop];
        const isColorProp = this._isColorProp(prop);
        const isSymbolProp = this._isSymbolProp(prop);
        if (!isColorProp && !isSymbolProp) {
          this.log.info(prop, value);
          const settingProp = this._convertPropToSettingStr(prop);
          // const typedValue = JSON.parse(`{${prop}: ${value}}`);
          // this.log.info('typedValue', typedValue);
          let typedValue: any = value;
          let numberValue = parseFloat(value);
          if (!Number.isNaN(numberValue)) {
            typedValue = numberValue;
          } else if (value === 'true') {
            typedValue = true;
          } else if (value === 'false') {
            typedValue = false;
          } else if (this._hasDoubleQuotes(value)) {
            typedValue = this._trimQuotes(value);
          }

          result[`${settingGroup}.${settingProp}`] = typedValue;
        } else if (isColorProp) {
          this._processColorProps(prop, value);
        } else if (isSymbolProp) {
          this._processSymbolProps(prop, value);
        }
      });
    });

    return result;
  }

  protected _isSameDomain(styleSheet: CSSStyleSheet) {
    if (!styleSheet.href) {
      return true;
    }
    return styleSheet.href.indexOf(window.location.origin) === 0;
  };

  // returns boolean and narrows type to CSSStyleRule
  protected _isStyleRule(rule: CSSRule): rule is CSSStyleRule {
    return rule instanceof CSSStyleRule;
  }

  protected _isParaProp(propName: string): boolean {
    return propName.startsWith(this._customPrefix);
  }

  protected _getParaRules() {
    const sameDomainStylesheets = [...document.styleSheets].filter(this._isSameDomain);

    for (const sheet of sameDomainStylesheets) {
      const styleRules = [...sheet.cssRules].filter(this._isStyleRule);
      for (const styleRule of styleRules) {
        const paraProps = [...styleRule.style]
          .filter(this._isParaProp.bind(this))
          .map((propName) => {
            return {
              [propName]: styleRule.style.getPropertyValue(propName)
            }
          });

        // TODO: Replace hardcoded warning strings with Templum templates
        if (paraProps.length) {
          const selector = styleRule.selectorText;
          if (!this._paraRules[selector]) {
            this._paraRules[selector] = {};
          } else {
            this.log.warn(`[ParaCharts] Duplicate selector '${selector}'; collecting all properties`);
          }
          paraProps.forEach(prop => {
            Object.entries(prop).forEach(([key, value]) => {
              this._convertPropToSettingStr(key);
              const oldValue = this._paraRules[selector][key];
              if (oldValue) {
                const warningMsg = (oldValue === value)
                  ? `[ParaCharts] Duplicate value '${value}' for property '${key}' in selector '${selector}'`
                  : `[ParaCharts] Replaced value '${oldValue}' with value '${value}' for property '${key}' in selector '${selector}'`;
                this.log.warn(warningMsg);
              }
              this._paraRules[selector][key] = value;
            });
          });
        }
      }
    }
  }

  protected _hasDoubleQuotes(str: string): boolean {
    return (str.startsWith(`"`) && str.endsWith(`"`)) || (str.startsWith(`'`) && str.endsWith(`'`));
  }

  protected _trimQuotes(str: string): string {
    return str.replace(/['"]/g, '');
  }


  protected _convertPropToSettingStr(propStr: string): string {
    const bareProp = propStr.replace(this._customPrefix, '');
    const settingStr = this._convertKebabToCamelCase(bareProp);

    return settingStr;
  }

  protected _convertKebabToCamelCase(kebabCaseStr: string): string {
    const camelCaseStr = kebabCaseStr.replace(/-./g, (match) => match[1].toUpperCase());
    return camelCaseStr;
  }

  protected _convertCamelToKebabCase(camelCaseStr: string): string {
    // [A-Z]+(?![a-z]) matches any consecutive capital letters, excluding any capitals 
    // followed by a lowercase (signifying the next word). Adding |[A-Z] then includes 
    // any single capital letters. It must be after the consecutive capital expression, 
    // otherwise the expression will match all capital letters individually and never 
    // match consecutives.

    // `String.prototype.replace` can take a replacer function. Here, it returns the 
    // lowercased matched capital(s) for each word, after prefixing a hyphen when the 
    // match offset is truthy (not zero - not the first character of the string).

    // The 0-9 additions split numbers into their own token, such as `color-series-0`.

    const kebabCaseStr = camelCaseStr.replace(/[A-Z0-9]+(?![a-z0-9])|[A-Z]/g, (match, offset) => (offset ? '-' : '') + match.toLowerCase());

    return kebabCaseStr;
  }


  protected _isColorProp(propName: string): boolean {
    const colorMatch = propName.match(/series-\d+-color/gi);
    const palletteMatch = propName.match(/palette/gi);
    // let result = string.match(/eek/gi);
    const isColorProp = (colorMatch?.length || palletteMatch?.length) ? true : false;
    return isColorProp;
  }

  protected _processColorProps(propName: string, propValue: string) {
    if (!this._colorPalette) {
      this._colorPalette = {
        key: 'custom-0',
        title: 'Custom palette',
        colors: []
      }
    }

    if (propName === `${this._customPrefix}palette`) {
      const paletteIdArray = propValue.split(/,\s+/);
      this._colorPalette.key = this._trimQuotes(paletteIdArray[0]);
      this._colorPalette.title = this._trimQuotes(paletteIdArray[1]);
    }
    else {
      const seriesIndex = parseInt((propName.match(/\d+/g) as string[])[0]);
      const valueArray = propValue.split(/,\s+['"]/);
      this.log.info('color valueArray', valueArray);

      this._colorPalette.colors[seriesIndex] = {
        value: valueArray[0],
        name: this._trimQuotes(valueArray[1])
      };
    }

    // this.log.info('this._colorPalette', this._colorPalette);
  }

  registerColors() {
    if (this._colorPalette) {
      this._store.colors.addPalette(this._colorPalette);
      this._store.colors.selectPaletteWithKey(this._colorPalette.key);
    }
  }

  protected _isSymbolProp(propName: string): boolean {
    const symbolMatch = propName.match(/series-\d+-symbol/gi);
    const isSymbolProp = (symbolMatch?.length) ? true : false;
    return isSymbolProp;
  }

  protected _processSymbolProps(propName: string, propValue: string) {
    if (!this._symbolSet) {
      this._symbolSet = [];
    }

    const seriesIndex = parseInt((propName.match(/\d+/g) as string[])[0]);
    const valueArray = propValue.split(/,\s+['"]/);
    const dataSymbolShape = this._trimQuotes(valueArray[0]) as DataSymbolShape;
    const dataSymbolFill = this._trimQuotes(valueArray[1]) as DataSymbolFill;

    this._symbolSet[seriesIndex] = `${dataSymbolShape}.${dataSymbolFill}`;

    // this.log.info('this._symbolSet', this._symbolSet);
  }

  registerSymbols() {
    if (this._symbolSet) {
      // register proper symbol for each series
      this._store.symbols.types = this._symbolSet;
    }
  }
}