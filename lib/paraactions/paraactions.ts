// Minimal ParaActions AST + parser + executor.
//
// - Single actions and chained actions share one type (ParaAction).
// - Arguments are positional only (no named args).
// - Executor uses `ctx` for chaining and throws on unknown actions,
//   so the host (Scrollyteller, etc.) can catch and report errors.

// ---------- AST TYPES ----------

export type ParaValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'identifier';

export interface ParaValue {
  kind: ParaValueKind;
  value: string | number | boolean | null;
}

export interface CallSegment {
  methodName: string;
  args: ParaValue[];
}

/**
 * Unified action:
 * - Single action: segments.length === 1
 * - Chain: segments.length > 1
 */
export interface ParaAction {
  kind: 'action';
  segments: CallSegment[]; // must have at least 1
  raw?: string;
}

export interface ParaActionList {
  actions: ParaAction[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  raw: string;
}

// ---------- PUBLIC PARSING API ----------

/**
 * Parse a full action list from a multi-line string.
 * Each non-empty line is parsed as a single ParaAction:
 *
 *   highlightSeries(revenue)
 *   api.getChart('main').highlightSeries(revenue)
 *
 */
export function parseActionList(source: string): ParaActionList {
  const actions: ParaAction[] = [];
  const errors: ParseError[] = [];

  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    try {
      const action = parseSingleAction(trimmed);
      if (action) actions.push(action);
    } catch (err) {
      errors.push({
        message:
          err instanceof Error ? err.message : 'Unknown parse error in action line.',
        line: lineNo,
        column: 1,
        raw: rawLine,
      });
    }
  }

  return { actions, errors };
}

/**
 * Parse a single action string into a ParaAction.
 * Throws on syntax errors.
 */
export function parseAction(source: string): ParaAction | null {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error('Cannot parse empty action string.');
  }
  return parseSingleAction(trimmed);
}

// ---------- INTERNAL PARSING ----------

/**
 * Parse any action expression:
 * - "highlightSeries(revenue)"
 * - "resetHighlight"
 * - "api.getChart('main').highlightSeries(revenue)"
 *
 * Chain detection is implicit: we always split into chain segments first,
 * then parse each into a CallSegment.
 */
function parseSingleAction(line: string): ParaAction | null {
  if (!line) return null;

  const rawSegments = splitChainSegments(line);
  if (rawSegments.length === 0) {
    throw new Error('Empty action expression.');
  }

  const segments: CallSegment[] = rawSegments.map(parseMethodCallSegment);

  return {
    kind: 'action',
    segments,
    raw: line,
  };
}

// ---------- CHAIN PARSING ----------

/**
 * Split `api.getChart('main').highlightSeries(revenue, industry)` into:
 * ["api", "getChart('main')", "highlightSeries(revenue, industry)"].
 *
 * If there are no top-level dots, you just get a single segment:
 * ["highlightSeries(revenue)"].
 */
function splitChainSegments(source: string): string[] {
  const segments: string[] = [];
  let current = '';
  let depth = 0;
  let inString: "'" | '"' | null = null;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      current += ch;
      if (ch === inString) {
        inString = null;
      } else if (ch === '\\' && i + 1 < source.length) {
        current += source[++i];
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = ch;
      current += ch;
      continue;
    }

    if (ch === '(') {
      depth++;
      current += ch;
      continue;
    }

    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    // Top-level dot (not in parens or string) splits the chain
    if (ch === '.' && depth === 0) {
      if (current.trim()) segments.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) segments.push(current.trim());
  return segments;
}

/**
 * Parse "getChart('main')" or "highlightSeries(revenue, industry)" or just "resetHighlight".
 */
function parseMethodCallSegment(segment: string): CallSegment {
  const open = segment.indexOf('(');

  if (open === -1) {
    const methodName = segment.trim();
    if (!methodName) {
      throw new Error('Empty method name in segment: ' + segment);
    }
    return {
      methodName,
      args: [],
    };
  }

  const close = segment.lastIndexOf(')');
  if (close === -1 || close < open) {
    throw new Error('Unclosed parentheses in segment: ' + segment);
  }

  const methodName = segment.slice(0, open).trim();
  if (!methodName) {
    throw new Error('Missing method name before "(": ' + segment);
  }

  const argsSrc = segment.slice(open + 1, close).trim();
  const args = argsSrc ? parseArgsList(argsSrc) : [];

  return {
    methodName,
    args,
  };
}

// ---------- ARGUMENT PARSING (positional only) ----------

function parseArgsList(source: string): ParaValue[] {
  const parts = splitArgs(source);
  const result: ParaValue[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const value = parseValue(trimmed);
    result.push(value);
  }

  return result;
}

/**
 * Split "revenue, industry, 2, 'Q4 peak'" into pieces,
 * respecting quoted strings.
 */
function splitArgs(source: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inString: "'" | '"' | null = null;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      current += ch;
      if (ch === inString) {
        inString = null;
      } else if (ch === '\\' && i + 1 < source.length) {
        current += source[++i];
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = ch;
      current += ch;
      continue;
    }

    if (ch === ',') {
      parts.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (current) parts.push(current);
  return parts;
}

// ---------- VALUE PARSING ----------

function parseValue(source: string): ParaValue {
  const trimmed = source.trim();

  if (!trimmed) {
    return { kind: 'identifier', value: '' };
  }

  const firstChar = trimmed[0];

  // String literal
  if (firstChar === "'" || firstChar === '"') {
    return parseStringValue(trimmed);
  }

  // Boolean
  if (trimmed === 'true') {
    return { kind: 'boolean', value: true };
  }
  if (trimmed === 'false') {
    return { kind: 'boolean', value: false };
  }

  // null
  if (trimmed === 'null') {
    return { kind: 'null', value: null };
  }

  // Number
  const num = Number(trimmed);
  if (!Number.isNaN(num)) {
    return { kind: 'number', value: num };
  }

  // Fallback: identifier (e.g., series names)
  return { kind: 'identifier', value: trimmed };
}

function parseStringValue(source: string): ParaValue {
  const quote = source[0];
  if (quote !== "'" && quote !== '"') {
    throw new Error('parseStringValue on non-string: ' + source);
  }

  if (source.length < 2 || source[source.length - 1] !== quote) {
    throw new Error('Unterminated string literal: ' + source);
  }

  const inner = source.slice(1, -1);
  return {
    kind: 'string',
    value: inner,
  };
}

// ---------- EXECUTOR (WITH CTX, ERRORS BUBBLE TO HOST) ----------

export type ActionHandler<Ctx = unknown> = (
  ctx: Ctx,
  args: ParaValue[]
) => Ctx | void;

export type ActionRegistry<Ctx = unknown> = Record<string, ActionHandler<Ctx>>;

// execute actions by calling methods directly on the initial context (e.g., parachart.api) ===
function paraValuesToJsArgs(args: ParaValue[]): unknown[] {
  return args.map(arg => arg.value);
}

/**
 * Execute a single ParaAction (single or chained) by treating each segment
 * as a method call on the current context object.
 *
 * - `initialContext` is typically a root API object such as `parachart.api`.
 * - Each segment's method name is looked up on the current context.
 * - If a method returns a non-undefined value, it becomes the context for the next segment.
 * - If a method is not found on the current context, this function throws.
 * - This function does NOT catch errors; they bubble to the host.
 */
export function executeParaAction<Ctx>(
  action: ParaAction,
  initialContext: Ctx
): Ctx {
  let ctx: any = initialContext;
  // console.warn('executeParaAction', ctx)
  for (const segment of action.segments) {
    // console.log('ctx', ctx)
    const method = ctx?.[segment.methodName];
    if (typeof method !== 'function') {
      throw new Error(
        `Unknown action method on context: ${segment.methodName}`
      );
    }

    const jsArgs = paraValuesToJsArgs(segment.args);
    const result = method.apply(ctx, jsArgs);
    if (typeof result !== 'undefined') {
      ctx = result;
    }
  }
  return ctx as Ctx;
}

/**
 * Convenience: execute a list of actions in sequence.
 * Errors still bubble to the host.
 */
export function executeParaActionList<Ctx>(
  actions: ParaAction[],
  initialContext: Ctx
): Ctx {
  let ctx = initialContext;
  for (const action of actions) {
    ctx = executeParaAction(action, ctx);
  }
  return ctx;
}
