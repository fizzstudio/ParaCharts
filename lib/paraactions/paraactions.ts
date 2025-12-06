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

// Allow multiple ParaActions per line separated by whitespace or semicolons
// Use shared top-level splitter for whitespace/semicolon-separated actions
function splitActionsOnLine(line: string): string[] {
  const raw = splitTopLevel(line, (ch) => ch === ' ' || ch === '\t' || ch === ';');
  const actions: string[] = [];

  for (const part of raw) {
    const trimmed = part.trim();
    if (trimmed) actions.push(trimmed);
  }

  return actions;
}

/**
 * Parse a full action list from a multi-line string.
 * Each non-empty line is parsed as a single ParaAction:
 *
 *   highlightSeries(revenue)
 *   api.getChart('main').highlightSeries(revenue)
 *
 */
// support multiple top-level actions per line (space or semicolon separated) ===
export function parseActionList(source: string): ParaActionList {
  const actions: ParaAction[] = [];
  const errors: ParseError[] = [];

  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Allow multiple action expressions on the same line, separated by
    // top-level whitespace or semicolons (not inside strings or parentheses).
    const expressions = splitActionsOnLine(trimmed);
    for (const expr of expressions) {
      try {
        const action = parseSingleAction(expr);
        if (action) actions.push(action);
      } catch (err) {
        errors.push({
          message:
            err instanceof Error
              ? err.message
              : 'Unknown parse error in action expression.',
          line: lineNo,
          column: 1,
          raw: expr,
        });
      }
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

function splitChainSegments(source: string): string[] {
  const rawSegments = splitTopLevel(source, (ch) => ch === '.');
  const segments: string[] = [];

  for (const part of rawSegments) {
    const trimmed = part.trim();
    if (trimmed) segments.push(trimmed);
  }

  return segments;
}

// ---------- SHARED PARSING ----------

/**
 * Split `api.getChart('main').highlightSeries(revenue, industry)` into:
 * ["api", "getChart('main')", "highlightSeries(revenue, industry)"].
 *
 * If there are no top-level dots, you just get a single segment:
 * ["highlightSeries(revenue)"].
 */

// Share top-level splitting logic (strings + parens) across DSL helpers ===
function splitTopLevel(
  source: string,
  isSeparator: (ch: string) => boolean
): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inString: "'" | '"' | null = null;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    // If we're inside a quoted string, only leave on matching quote,
    // treating escapes consistently with other parsers here.
    if (inString) {
      current += ch;
      if (ch === inString) {
        inString = null;
      } else if (ch === '\\' && i + 1 < source.length) {
        current += source[++i];
      }
      continue;
    }

    // Enter string
    if (ch === "'" || ch === '"') {
      inString = ch;
      current += ch;
      continue;
    }

    // Track parentheses depth so we don't split inside argument lists.
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

    // At top level (not in string or parens), allow the caller to define
    // which characters act as separators.
    if (depth === 0 && isSeparator(ch)) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current) {
    parts.push(current);
  }

  // Minimal diagnostics: warn if we finished with unmatched parens or an open string.
  // If we finish with non-zero depth, unmatched parens, or an open string, the DSL source is malformed.
  if (depth !== 0 || inString !== null) {
    // Non-throwing on purpose: this is just a hint for authors / debugging.
    // Callers that care can still treat this as a signal via console inspection.
    throw new Error(`ParaActions.splitTopLevel: possible unmatched parentheses or unterminated string in DSL source:\n"${source}"`);
  }

  return parts;
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
  // Use shared top-level splitter for comma-separated arguments
  // Note: we intentionally do not trim here; parseArgsList is responsible
  //      for trimming and skipping empty/whitespace-only entries.
  return splitTopLevel(source, (ch) => ch === ',');
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

// execute actions by calling methods directly on the initial context (e.g., parachart.api) ===
function paraValuesToJsArgs(args: ParaValue[]): unknown[] {
  return args.map(arg => arg.value);
}


/**
 * Execute a single or array of ParaActions (single or chained) by treating each segment
 * as a method call on the current context object.
 *
 * - `initialContext` is typically a root API object such as `parachart.api`.
 * - Each segment's method name is looked up on the current context.
 * - If a method returns a non-undefined value, it becomes the context for the next segment.
 * - If a method is not found on the current context, this function throws.
 * - This function does NOT catch errors; they bubble to the host.
 */
export function executeParaActions<Ctx>(
  actions: ParaAction | ParaAction[],
  initialContext: Ctx
): void {
  const actionList = Array.isArray(actions) ? actions : [actions];

  for (const action of actionList) {
    // Each ParaAction is a full chain; all start from the root API context.
    let ctx: any = initialContext;
    // console.warn('executeParaActions', ctx)
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
  }
}
