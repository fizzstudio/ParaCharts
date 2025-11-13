export function setDebugLevel(debugLevel: DebugLevel) {
  _debugLevel = debugLevel;
}
let _debugLevel: DebugLevel = "most";
const LOG_NONE = 0;
const LOG_SOME = 1;
const LOG_MOST = 2;
const LOG_ALL = 3;
export type DebugLevel = 0 | 1 | 2 | 3;

export class Logger {
  private name: string;
  private debugLevel: DebugLevel;
  constructor(name: string, debugLevel: DebugLevel) {
    this.name = name;
	this.debugLevel = debugLevel;
  }
  info(...data: any[]) {
    if (this.debugLevel === LOG_ALL) {
	  console.log(`[${this.name}]`, ...data);
	}
  }
  warn(...data: any[]) {
    if (this.debugLevel <= LOG_MOST) {
	  console.warn(`[${this.name}]`, ...data);
	}
  }
  error(...data: any[]) {
    if (this.debugLevel <= LOG_SOME) {
	  console.error(`[${this.name}]`, ...data);
	}
  }
}

function getLogger(logName: string): Logger {
  return new Logger(logName, _debugLevel);
}