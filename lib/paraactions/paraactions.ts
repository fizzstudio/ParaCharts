// lib/paraactions/paraactions.ts
// Small DSL parser + executor for declarative ParaCharts actions,
// with support for braced `when(...) { ... }` blocks and nesting.
//
// See previous comments in this file header for full language description.

export type ParaValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'identifier';

export interface ParaValue {
  valueKind: ParaValueKind;
  value: string | number | boolean | null;
}

// Arguments
export interface ParaPositionalArg extends ParaValue {
  kind: 'positional';
}

export interface ParaNamedArg extends ParaValue {
  kind: 'named';
  name: string;
}

export type ParaActionArg = ParaPositionalArg | ParaNamedArg;

// AST for simple actions
export interface NamedAction {
  kind: 'namedAction';
  name: string;
  args: ParaActionArg[];
}

// One segment of a chain: methodName(args...)
export interface ChainSegment {
  methodName: string;
  args: ParaActionArg[];
}

export interface ChainAction {
  kind: 'chain';
  segments: ChainSegment[];
}

// Guard conditions for when-blocks
export interface GuardCondition {
  direction?: 'up' | 'down';
  progressMin?: number;
  progressMax?: number;
}

// Guarded block: when(condition) { actions... }
export interface GuardedBlock {
  kind: 'guardedBlock';
  condition: GuardCondition;
  actions: ParaAction[];
}

// Union
export type ParaAction = NamedAction | ChainAction | GuardedBlock;

// Generic handler types (host-specific type C is context object)
export type ParaActionHandler<C> = (ctx: C, ...args: ParaActionArg[]) => unknown;
export type ParaActionHandlerMap<C> = Record<string, ParaActionHandler<C>>;

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse an attribute string into a list of ParaAction AST nodes.
 */
export function parseParaActionList(input: string | null): ParaAction[] {
  if (!input) return [];

  const trimmed = input.trim();
  if (!trimmed) return [];

  return parseActionListTop(trimmed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level recursive parser with when { ... } support
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a sequence of actions and when-blocks at the current "block level".
 * This function is recursive: it is used for the top-level and for the
 * contents of each `when { ... }` block.
 */
function parseActionListTop(input: string): ParaAction[] {
  const actions: ParaAction[] = [];
  const len = input.length;
  let i = 0;

  const skipWs = () => {
    while (i < len && /\s/.test(input[i] ?? '')) i++;
  };

  while (i < len) {
    skipWs();
    if (i >= len) break;

    // Detect when(...) { ... } at this position
    if (startsWithIdentifier(input, i, 'when')) {
      const block = parseWhenBlockAt(input, () => i);
      if (block) {
        actions.push(block.action);
        i = block.nextIndex;
        continue;
      }
      // If it looked like when but failed to parse as a block,
      // fall through and try to parse as a normal action.
    }

    // Parse a single "simple" action expression (named or chain),
    // up to the next top-level whitespace.
    const { action, nextIndex } = parseSimpleActionAt(input, i);
    if (action) {
      actions.push(action);
    }
    i = nextIndex;
  }

  return actions;
}

/**
 * Test whether the string at index i starts with the given identifier
 * and is followed by either whitespace or '('.
 */
function startsWithIdentifier(source: string, index: number, ident: string): boolean {
  if (!source.startsWith(ident, index)) return false;
  const end = index + ident.length;
  const nextCh = source[end];
  if (nextCh == null) return true;
  if (nextCh === '(' || /\s/.test(nextCh)) return true;
  return false;
}

/**
 * Parse a when-block starting at the current index.
 */
function parseWhenBlockAt(
  source: string,
  getIndex: () => number
): { action: GuardedBlock; nextIndex: number } | null {
  let i = getIndex();
  const len = source.length;

  // Consume "when"
  if (!startsWithIdentifier(source, i, 'when')) return null;
  i += 'when'.length;

  // Skip whitespace
  while (i < len && /\s/.test(source[i] ?? '')) i++;

  // Expect '('
  if (source[i] !== '(') return null;
  i++;

  // Extract condition text up to matching ')'
  const condStart = i;
  let depth = 1;
  let inSingle = false;
  let inDouble = false;

  while (i < len && depth > 0) {
    const ch = source[i];

    if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      i++;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }

    i++;
  }

  if (depth !== 0 || source[i] !== ')') {
    return null;
  }

  const condEnd = i;
  const conditionText = source.slice(condStart, condEnd);
  i++; // skip ')'

  // Skip whitespace
  while (i < len && /\s/.test(source[i] ?? '')) i++;

  // Expect '{'
  if (source[i] !== '{') {
    return null;
  }
  i++; // skip '{'

  // Extract block contents up to matching '}'
  const blockStart = i;
  let braceDepth = 1;
  inSingle = false;
  inDouble = false;

  while (i < len && braceDepth > 0) {
    const ch = source[i];

    if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      i++;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          break;
        }
      }
    }

    i++;
  }

  if (braceDepth !== 0 || source[i] !== '}') {
    return null;
  }

  const blockEnd = i;
  const blockText = source.slice(blockStart, blockEnd);
  i++; // skip '}'

  const condition = parseWhenCondition(conditionText);
  const innerActions = parseActionListTop(blockText);

  const guarded: GuardedBlock = {
    kind: 'guardedBlock',
    condition,
    actions: innerActions,
  };

  return { action: guarded, nextIndex: i };
}

/**
 * Parse a single "simple" action (named or chain) starting at index i,
 * up to the next top-level whitespace.
 */
function parseSimpleActionAt(
  source: string,
  startIndex: number
): { action: ParaAction | null; nextIndex: number } {
  const len = source.length;
  let i = startIndex;

  let depthParens = 0;
  let depthBraces = 0;
  let inSingle = false;
  let inDouble = false;

  while (i < len) {
    const ch = source[i];

    if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      i++;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '(') {
        depthParens++;
      } else if (ch === ')') {
        depthParens = Math.max(0, depthParens - 1);
      } else if (ch === '{') {
        depthBraces++;
      } else if (ch === '}') {
        depthBraces = Math.max(0, depthBraces - 1);
      }

      // Top-level whitespace separates actions
      if (/\s/.test(ch) && depthParens === 0 && depthBraces === 0) {
        break;
      }
    }

    i++;
  }

  const raw = source.slice(startIndex, i).trim();
  if (!raw) {
    return { action: null, nextIndex: i };
  }

  const action = parseSingleAction(raw);
  return { action, nextIndex: i };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing of Named / Chain actions (re-used inside blocks)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a single action string into either a NamedAction or a ChainAction.
 */
function parseSingleAction(input: string): ParaAction | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Chain call if there's a dot BEFORE the first '(' (e.g., api.getChart(...))
  const firstParen = trimmed.indexOf('(');
  const firstDot = trimmed.indexOf('.');
  const isChain = firstDot !== -1 && (firstParen === -1 || firstDot < firstParen);

  if (isChain) {
    return parseChainAction(trimmed);
  }

  return parseNamedAction(trimmed);
}

function parseNamedAction(input: string): NamedAction | null {
  const nameMatch = /^([a-zA-Z_][\w]*)/.exec(input);
  if (!nameMatch) return null;

  const name = nameMatch[1];
  const rest = input.slice(name.length).trim();

  let args: ParaActionArg[] = [];
  if (rest.startsWith('(') && rest.endsWith(')')) {
    const inner = rest.slice(1, -1);
    args = parseArgs(inner);
  }

  return {
    kind: 'namedAction',
    name,
    args,
  };
}

function parseChainAction(input: string): ChainAction | null {
  // Split by '.' but keep parentheses content together.
  const segments: ChainSegment[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) {
      const seg = parseChainSegment(trimmed);
      if (seg) segments.push(seg);
    }
    current = '';
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
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
      if (ch === '.' && depth === 0) {
        flush();
        continue;
      }
    }

    current += ch;
  }

  flush();

  if (segments.length === 0) {
    return null;
  }

  return {
    kind: 'chain',
    segments,
  };
}

function parseChainSegment(segment: string): ChainSegment | null {
  const nameMatch = /^([a-zA-Z_][\w]*)/.exec(segment);
  if (!nameMatch) return null;

  const methodName = nameMatch[1];
  const rest = segment.slice(methodName.length).trim();

  let args: ParaActionArg[] = [];
  if (rest.startsWith('(') && rest.endsWith(')')) {
    const inner = rest.slice(1, -1);
    args = parseArgs(inner);
  }

  return {
    methodName,
    args,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Arg/value parsing (re-used for when conditions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a comma-separated argument list.
 */
function parseArgs(input: string): ParaActionArg[] {
  const out: ParaActionArg[] = [];
  const parts = splitArgs(input);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const name = trimmed.slice(0, eqIndex).trim();
      const valueStr = trimmed.slice(eqIndex + 1).trim();
      const value = parseValue(valueStr);
      out.push({
        kind: 'named',
        name,
        valueKind: value.valueKind,
        value: value.value,
      });
    } else {
      const value = parseValue(trimmed);
      out.push({
        kind: 'positional',
        valueKind: value.valueKind,
        value: value.value,
      });
    }
  }

  return out;
}

/**
 * Split arguments on commas, respecting parentheses/quotes.
 */
function splitArgs(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
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
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
    }

    current += ch;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Parse a scalar value:
 */
function parseValue(input: string): ParaValue {
  const trimmed = input.trim();

  // quoted string
  if (
    (trimmed.startsWith('\'') && trimmed.endsWith('\'')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const inner = trimmed.slice(1, -1);
    return {
      valueKind: 'string',
      value: inner,
    };
  }

  if (trimmed === 'true') {
    return { valueKind: 'boolean', value: true };
  }
  if (trimmed === 'false') {
    return { valueKind: 'boolean', value: false };
  }
  if (trimmed === 'null') {
    return { valueKind: 'null', value: null };
  }

  const num = Number(trimmed);
  if (!Number.isNaN(num)) {
    return { valueKind: 'number', value: num };
  }

  // identifier
  return {
    valueKind: 'identifier',
    value: trimmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// When condition parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the contents of when(...), e.g.:
 *   "direction='down'"
 *   "direction='down', progressMin=0.3, progressMax=0.7"
 *   "'down'"   // shorthand for direction='down'
 */
function parseWhenCondition(conditionText: string): GuardCondition {
  const args = parseArgs(conditionText);
  const named = args.filter((a): a is ParaNamedArg => a.kind === 'named');
  const positional = args.filter(a => a.kind === 'positional');

  const cond: GuardCondition = {};

  // Named direction
  const dirNamed = named.find(a => a.name === 'direction');
  // Positional shorthand: when('down')
  const firstPos = positional[0];

  const rawDirection = dirNamed?.value ?? firstPos?.value;
  if (rawDirection != null) {
    const dirStr = String(rawDirection);
    if (dirStr === 'up' || dirStr === 'down') {
      cond.direction = dirStr;
    }
  }

  const progMin = named.find(a => a.name === 'progressMin');
  const progMax = named.find(a => a.name === 'progressMax');

  if (progMin) {
    const n = Number(progMin.value);
    if (!Number.isNaN(n)) cond.progressMin = n;
  }
  if (progMax) {
    const n = Number(progMax.value);
    if (!Number.isNaN(n)) cond.progressMax = n;
  }

  return cond;
}

// ─────────────────────────────────────────────────────────────────────────────
// Execution
// ─────────────────────────────────────────────────────────────────────────────

type GuardFn<C> = (ctx: C) => boolean;

function makeGuardFn<C>(condition: GuardCondition): GuardFn<C> {
  return (ctx: any) => {
    // direction check
    if (condition.direction) {
      if (ctx.direction !== condition.direction) return false;
    }

    const progress = typeof ctx.progress === 'number' ? ctx.progress : 0;

    if (typeof condition.progressMin === 'number') {
      if (progress < condition.progressMin) return false;
    }
    if (typeof condition.progressMax === 'number') {
      if (progress > condition.progressMax) return false;
    }

    return true;
  };
}

/**
 * Execute a list of ParaActions.
 */
export function executeParaActions<Ctx>(
  host: unknown,
  actions: ParaAction[],
  ctx: Ctx,
  actionMap: ParaActionHandlerMap<Ctx>,
  isDebug: boolean
): void {
  for (const action of actions) {
    switch (action.kind) {
      case 'namedAction': {
        const handler = actionMap[action.name];
        if (!handler) {
          if (isDebug) {
            // eslint-disable-next-line no-console
            console.warn(
              '[paraActions] unknown named action:',
              action.name,
              action
            );
          }
          continue;
        }
        try {
          handler(ctx, ...action.args);
        } catch (err) {
          if (isDebug) {
            // eslint-disable-next-line no-console
            console.error(
              '[paraActions] error in named action:',
              action.name,
              err
            );
          }
        }
        break;
      }

      case 'chain': {
        executeChainAction(host, action, isDebug);
        break;
      }

      case 'guardedBlock': {
        const guardFn = makeGuardFn<Ctx>(action.condition);
        if (!guardFn(ctx)) {
          if (isDebug) {
            // eslint-disable-next-line no-console
            console.log('[paraActions] guarded block skipped', action.condition);
          }
          break;
        }

        if (isDebug) {
          // eslint-disable-next-line no-console
          console.log('[paraActions] guarded block entered', action.condition);
        }

        executeParaActions(host, action.actions, ctx, actionMap, isDebug);
        break;
      }

      default:
        // Exhaustive guard
        // eslint-disable-next-line no-unused-expressions
        (action satisfies never);
    }
  }
}

/**
 * Execute a chained action like:
 *   api.getChart('main').getSeries('revenue').select()
 */
function executeChainAction(
  host: unknown,
  action: ChainAction,
  isDebug: boolean
): void {
  if (!action.segments.length) return;

  let target: any = (host as any)?.api ?? host;

  for (const segment of action.segments) {
    if (!target) {
      if (isDebug) {
        // eslint-disable-next-line no-console
        console.warn(
          '[paraActions] chain target became null before',
          segment.methodName
        );
      }
      return;
    }

    const fn = (target as any)[segment.methodName];
    if (typeof fn !== 'function') {
      if (isDebug) {
        // eslint-disable-next-line no-console
        console.warn(
          '[paraActions] method not found on chain target:',
          segment.methodName,
          target
        );
      }
      return;
    }

    // Convert ParaActionArg[] to raw JS values
    const jsArgs = segment.args.map(arg => arg.value);

    try {
      const result = fn.apply(target, jsArgs);
      // If the method returns something, chain continues on that; otherwise stay on current target
      if (result !== undefined && result !== null) {
        target = result;
      }
    } catch (err) {
      if (isDebug) {
        // eslint-disable-next-line no-console
        console.error(
          '[paraActions] error in chain segment:',
          segment.methodName,
          err
        );
      }
      return;
    }
  }
}
