/* ParaCharts: Signal Manager
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

export interface Signal {
  promise: Promise<any>;
  resolver: (arg: any) => void;
}

export interface SignalResults {
  [key: string]: any;
}

/**
 * Enables the use of Promise-based "signals" that can be awaited
 * in a function and emitted elsewhere. 
 */
export class SignalManager {
  
  private _signals: {[key: string]: Signal} = {};

  private addSignal(name: string) {
    const signal: Partial<Signal> = {};
    signal.promise = new Promise<any>((resolve) => {
      signal.resolver = resolve;
    });
    this._signals[name] = signal as Signal;
  }

  protected async _pending(isAny: boolean, names: string[]): Promise<any> {
    const signal = 'signal' + (names.length > 1 ? 's' : '');
    console.log(`waiting for ${isAny ? ' any of ' : ''}${signal}: '${names.join(', ')}'`);
    names.forEach(name => {
      if (!this._signals[name]) {
        this.addSignal(name);
      }
    });
    let f = isAny ? Promise.any : Promise.all;
    f = f.bind(Promise);
    const results = await f(names.map(name => this._signals[name].promise));
    console.log(`got ${signal}: '${names.join(', ')}'`);
    this.clear(...names);
    return results.length === 1 ? results[0] : Object.fromEntries(names.map((n, i) => [n, results[i]]));
  }

  async pending(name: string): Promise<any>;
  async pending(name0: string, name1: string, ...rest: string[]): Promise<SignalResults>; 
  async pending(...names: string[]) {
    return this._pending(false, names);
  }

  async pendingAny(name: string): Promise<any>;
  async pendingAny(name0: string, name1: string, ...rest: string[]): Promise<SignalResults>; 
  async pendingAny(...names: string[]) {
    return this._pending(true, names);
  }

  signal(name: string, arg?: any) {
    if (!this._signals[name]) {
      this.addSignal(name);
    }
    console.log(`fired signal '${name}'`);
    this._signals[name].resolver(arg);
  }

  clear(...names: string[]) {
    names.forEach(name => delete this._signals[name]);
  }

}
