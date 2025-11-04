

type Constructor<T = {}> = new (...args: any[]) => T;

export type Loggable = Constructor<{ logName(): string }>;

/**
 * @public
 */
export function logging<TBase extends Loggable>(Base: TBase) {
  return class _logging extends Base {

    log(...data: any[]) {
      //if (todo().debug) {
        //console.log(`[${this.logName()}]`, ...data);
      //}
    }

  };
}

export const Logger = logging(class {
  logName() {
    return 'LOGNAME';
  }
});