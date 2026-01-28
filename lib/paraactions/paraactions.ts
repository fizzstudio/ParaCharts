// paraactions.ts - Optimized lexer + parser with URL-safe :: syntax support (multi-arg)

/** DSL value types **/
export type ParaValue =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null'; value: null }
  | { kind: 'identifier'; value: string };

export interface CallSegment {
  methodName: string;
  args: ParaValue[];
}

export interface ParaAction {
  segments: CallSegment[];
}

/** Typed parse error used by the lexer and parser. */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
    public readonly line: number,
    public readonly column: number
  ) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = 'ParseError';
  }
}

/** ---------- LEXER ---------- **/

type TokenKind =
  | 'identifier'
  | 'number'
  | 'string'
  | 'boolean'
  | 'null'
  | 'dot'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'actionSep'
  | 'doubleColon'
  | 'eof';

interface Token {
  kind: TokenKind;
  value?: string | number | boolean | null;
  line: number;
  column: number;
}

// Helper: map tokens to ParaValue nodes.
function paraValueFromToken(token: Token, source: string): ParaValue {
  switch (token.kind) {
    case 'string':
      return { kind: 'string', value: token.value as string };
    case 'number':
      return { kind: 'number', value: token.value as number };
    case 'boolean':
      return { kind: 'boolean', value: token.value as boolean };
    case 'null':
      return { kind: 'null', value: null };
    case 'identifier':
      return { kind: 'identifier', value: token.value as string };
    default:
      throw new ParseError(
        `Unexpected token '${token.kind}' where a value was expected.`,
        source,
        token.line,
        token.column
      );
  }
}

/**
 * Optimized lexer for the ParaActions DSL.
 *
 * Responsibilities:
 * - Single pass over the source string.
 * - Tracks line/column for accurate error reporting.
 * - Emits:
 *   - literals: string/number/boolean/null
 *   - identifiers
 *   - punctuation: dot, lparen, rparen, comma, doubleColon
 *   - actionSep: top-level separators between expressions (from whitespace/semicolon)
 *   - eof: end-of-file marker
 * - Does NOT split expressions on cosmetic whitespace such as:
 *   - "foo ()"
 *   - "foo() .bar()"
 * - Whitespace / semicolons at top level become `actionSep` only when they look like
 *   they are between two full expressions.
 */
export function lexParaActions(source: string): Token[] {
  const tokens: Token[] = [];

  let i = 0;
  let line = 1;
  let column = 1;
  const length = source.length;

  // Last non-separator token kind (used to decide if whitespace is between expressions).
  let lastNonSepKind: TokenKind | null = null;

  const pushToken = (
    kind: TokenKind,
    value: string | number | boolean | null | undefined,
    tokenLine: number,
    tokenColumn: number
  ) => {
    tokens.push({ kind, value, line: tokenLine, column: tokenColumn });
    if (kind !== 'actionSep' && kind !== 'eof') {
      lastNonSepKind = kind;
    }
  };

  const isWhitespace = (ch: string) =>
    ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';

  const isDigit = (ch: string) => ch >= '0' && ch <= '9';

  const canStartExpressionChar = (ch: string | undefined): boolean => {
    if (!ch) return false;
    // Expression can start with ident/literal-ish things.
    return /[A-Za-z0-9_'"]/.test(ch);
  };

  const isExpressionEndKind = (kind: TokenKind | null): boolean => {
    return (
      kind === 'identifier' ||
      kind === 'number' ||
      kind === 'string' ||
      kind === 'boolean' ||
      kind === 'null' ||
      kind === 'rparen'
    );
  };

  while (i < length) {
    const ch = source[i];

    // Newline: update position and treat as whitespace.
    if (ch === '\n') {
      line += 1;
      column = 1;
      i += 1;
      continue;
    }

    // Whitespace (space, tab, CR) at this point.
    if (isWhitespace(ch)) {
      // Potential top-level separator if the previous token ended an expression.
      if (isExpressionEndKind(lastNonSepKind)) {
        // Lookahead to the next non-whitespace character.
        let j = i + 1;
        let laLine = line;
        let laColumn = column + 1;
        while (j < length && isWhitespace(source[j])) {
          if (source[j] === '\n') {
            laLine += 1;
            laColumn = 1;
          } else {
            laColumn += 1;
          }
          j += 1;
        }
        const nextChar = j < length ? source[j] : undefined;
        if (canStartExpressionChar(nextChar)) {
          // Whitespace between an expression-ending token and an expression-starting
          // character → treat as separator.
          pushToken('actionSep', undefined, line, column);
        }
      }

      // Consume this whitespace char (we already handled newline separately).
      i += 1;
      column += 1;
      continue;
    }

    // Semicolon: always a separator between actions.
    if (ch === ';') {
      pushToken('actionSep', undefined, line, column);
      i += 1;
      column += 1;
      continue;
    }

    // String literal?
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      const tokenLine = line;
      const tokenColumn = column;
      let value = '';

      // Skip opening quote
      i += 1;
      column += 1;

      while (i < length) {
        const c = source[i];

        if (c === '\n') {
          // Allow newlines in string, but keep tracking position.
          value += c;
          line += 1;
          column = 1;
          i += 1;
          continue;
        }

        if (c === quote) {
          // Closing quote.
          i += 1;
          column += 1;
          pushToken('string', value, tokenLine, tokenColumn);
          break;
        }

        // NOTE: Backslash escapes are not interpreted; this matches the
        // earlier behavior where the parser just stripped quotes.
        value += c;
        i += 1;
        column += 1;
      }

      if (i >= length && source[length - 1] !== quote) {
        throw new ParseError('Unterminated string literal.', source, tokenLine, tokenColumn);
      }

      continue;
    }

    // Parentheses
    // if (ch === '(') {
    //   pushToken('lparen', undefined, line, column);
    //   i += 1;
    //   column += 1;
    //   continue;
    // }
    // if (ch === ')') {
    //   pushToken('rparen', undefined, line, column);
    //   i += 1;
    //   column += 1;
    //   continue;
    // }
    if (ch === '(' || ch === ')') {
      const tokenName = (ch === '(') ? 'lparen' : 'rparen';
      pushToken(tokenName, undefined, line, column);
      i += 1;
      column += 1;
      continue;
    }

    // URL-safe double colon '::'
    if (ch === ':') {
      const next = source[i + 1];
      if (next === ':') {
        pushToken('doubleColon', undefined, line, column);
        i += 2;
        column += 2;
        continue;
      }
      throw new ParseError(
        "Unexpected ':' (did you mean '::' for URL-safe syntax?)",
        source,
        line,
        column
      );
    }

    // Punctuation
    // if (ch === '.') {
    //   pushToken('dot', undefined, line, column);
    //   i += 1;
    //   column += 1;
    //   continue;
    // }
    // if (ch === ',') {
    //   pushToken('comma', undefined, line, column);
    //   i += 1;
    //   column += 1;
    //   continue;
    // }
    if (ch === '.' || ch === ',') {
      const tokenName = (ch === '.') ? 'dot' : 'comma';
      pushToken(tokenName, undefined, line, column);
      i += 1;
      column += 1;
      continue;
    }

    // Number literal (supports leading '-' for negative numbers).
    if (ch === '-' || isDigit(ch)) {
      const tokenLine = line;
      const tokenColumn = column;
      let start = i;
      let sawDigit = isDigit(ch);

      i += 1;
      column += 1;

      while (i < length) {
        const c = source[i];
        if (isDigit(c)) {
          sawDigit = true;
          i += 1;
          column += 1;
          continue;
        }
        if (c === '.') {
          // Part of a decimal literal?
          const next = source[i + 1];
          if (isDigit(next)) {
            i += 1;
            column += 1;
            continue;
          }
        }
        break;
      }

      const rawNum = source.slice(start, i);
      const num = Number(rawNum);
      if (!sawDigit || Number.isNaN(num)) {
        throw new ParseError(
          `Invalid number literal: ${rawNum}`,
          source,
          tokenLine,
          tokenColumn
        );
      }

      pushToken('number', num, tokenLine, tokenColumn);
      continue;
    }

    // Identifier / keyword / boolean / null
    if (
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= 'a' && ch <= 'z') ||
      ch === '_'
    ) {
      const tokenLine = line;
      const tokenColumn = column;
      let start = i;

      i += 1;
      column += 1;

      while (i < length) {
        const c = source[i];
        if (
          (c >= 'A' && c <= 'Z') ||
          (c >= 'a' && c <= 'z') ||
          (c >= '0' && c <= '9') ||
          c === '_'
        ) {
          i += 1;
          column += 1;
        } else {
          break;
        }
      }

      const text = source.slice(start, i);
      if (text === 'true' || text === 'false') {
        pushToken('boolean', text === 'true', tokenLine, tokenColumn);
      } else if (text === 'null') {
        pushToken('null', null, tokenLine, tokenColumn);
      } else {
        pushToken('identifier', text, tokenLine, tokenColumn);
      }

      continue;
    }

    // Anything else is invalid in this DSL.
    throw new ParseError(
      `Unexpected character '${ch}' in ParaActions DSL.`,
      source,
      line,
      column
    );
  }

  // EOF marker
  pushToken('eof', undefined, line, column);
  return tokens;
}

/** ---------- PARSER ---------- **/

interface ParserState {
  tokens: Token[];
  index: number;
  source: string;
}

function current(state: ParserState): Token {
  return state.tokens[state.index];
}

function match(state: ParserState, kind: TokenKind): boolean {
  return current(state).kind === kind;
}

function advance(state: ParserState): Token {
  const tok = current(state);
  state.index = Math.min(state.index + 1, state.tokens.length - 1);
  return tok;
}

function consume(state: ParserState, kind: TokenKind, message: string): Token {
  const tok = current(state);
  if (tok.kind !== kind) {
    throw new ParseError(message, state.source, tok.line, tok.column);
  }
  state.index = Math.min(state.index + 1, state.tokens.length - 1);
  return tok;
}

// Parse '(' value (',' value)* ')' into ParaValue[]
function parseArguments(state: ParserState): ParaValue[] {
  consume(state, 'lparen', "Expected '(' to start argument list.");
  const args: ParaValue[] = [];

  if (!match(state, 'rparen')) {
    // At least one argument
    const firstTok = current(state);
    args.push(paraValueFromToken(firstTok, state.source));
    advance(state);

    while (match(state, 'comma')) {
      advance(state); // consume ','
      const valueTok = current(state);
      args.push(paraValueFromToken(valueTok, state.source));
      advance(state);
    }
  }

  consume(state, 'rparen', "Expected ')' to close argument list.");
  return args;
}

// [PC-EDIT] NEW: Parse one or more values after '::' for URL-safe calls: foo::a,b,c
function parseUrlArgs(state: ParserState): ParaValue[] {
  const args: ParaValue[] = [];

  // First value
  const first = current(state);
  args.push(paraValueFromToken(first, state.source));
  advance(state);

  // Subsequent ", value" pairs
  while (match(state, 'comma')) {
    advance(state); // consume ','
    const tok = current(state);
    args.push(paraValueFromToken(tok, state.source));
    advance(state);
  }

  return args;
}

// Parse a single call segment: methodName(args?) or methodName::value[,value...]
function parseCallSegment(state: ParserState): CallSegment {
  const nameTok = current(state);
  if (nameTok.kind !== 'identifier') {
    throw new ParseError(
      `Expected method name, found '${nameTok.kind}'.`,
      state.source,
      nameTok.line,
      nameTok.column
    );
  }
  advance(state); // consume identifier

  let args: ParaValue[] = [];

  if (match(state, 'lparen')) {
    // Standard DSL: foo(arg1, arg2, ...)
    args = parseArguments(state);
  } else if (match(state, 'doubleColon')) {
    // [PC-EDIT] CHANGED: URL-safe multi-arg form: foo::a,b,c
    advance(state); // consume 'doubleColon'
    args = parseUrlArgs(state);
  } else {
    // No args
    args = [];
  }

  return {
    methodName: nameTok.value as string,
    args,
  };
}

// Parse a full action chain: CallSegment ('.' CallSegment)*
function parseActionChain(state: ParserState): ParaAction {
  const segments: CallSegment[] = [];
  segments.push(parseCallSegment(state));

  while (match(state, 'dot')) {
    advance(state); // consume '.'
    segments.push(parseCallSegment(state));
  }

  return { segments };
}

// [PC-EDIT] New structured result type for parseActionList (actions + errors).
export interface ParseActionListResult {
  actions: ParaAction[];
  errors: ParseError[];
}

/**
 * Parse a DSL attribute string into a list of ParaActions.
 * Never throws for parse errors; instead returns them in `errors`.
 */
export function parseActionList(source: string): ParseActionListResult {
  const actions: ParaAction[] = [];
  const errors: ParseError[] = [];

  if (!source || !source.trim()) {
    return { actions, errors };
  }

  try {
    const tokens = lexParaActions(source);
    const state: ParserState = { tokens, index: 0, source };

    while (!match(state, 'eof')) {
      // Skip any leading separators defensively.
      while (match(state, 'actionSep')) {
        advance(state);
      }
      if (match(state, 'eof')) break;

      actions.push(parseActionChain(state));

      // Consume at most one separator after a chain.
      if (match(state, 'actionSep')) {
        advance(state);
      }
    }
  } catch (err) {
    if (err instanceof ParseError) {
      errors.push(err);
    } else {
      // Re-throw unexpected errors so they don't get silently swallowed.
      throw err;
    }
  }

  return { actions, errors };
}


/**
 * Parse a string expected to contain a single ParaAction.
 * Returns null for an empty or whitespace-only string,
 * throws ParseError if more than one action is present.
 */
// [PC-EDIT] Updated to consume ParseActionListResult and still throw for invalid single actions.
export function parseAction(source: string): ParaAction | null {
  const { actions, errors } = parseActionList(source);

  if (errors.length > 0) {
    // Preserve legacy behavior for callers that expect a thrown ParseError
    // when given an invalid single-action string.
    throw errors[0];
  }

  if (actions.length === 0) {
    return null;
  }
  if (actions.length > 1) {
    throw new ParseError(
      'Expected a single action, but found multiple.',
      source,
      1,
      1
    );
  }
  return actions[0];
}

/** ---------- EXECUTION ---------- **/

/**
 * Execute one or more ParaActions against an initial context object.
 *
 * - `initialContext` is typically a root API object such as `parachart.api`.
 * - Each CallSegment's method name is looked up on the current context.
 * - If a method returns a non-undefined value, it becomes the context for the next segment.
 * - If a method is not found on the current context, this function throws.
 * - Errors thrown by handlers bubble to the host.
 */
export function executeParaActions<Ctx>(
  actions: ParaAction | ParaAction[],
  initialContext: Ctx
): void {
  const list = Array.isArray(actions) ? actions : [actions];

  for (const action of list) {
    let ctx: any = initialContext;

    for (const segment of action.segments) {
      const method = ctx?.[segment.methodName];
      if (typeof method !== 'function') {
        throw new Error(`Unknown action method on context: ${segment.methodName}`);
      }

      const jsArgs = segment.args.map((v) => v.value);
      const result = method.apply(ctx, jsArgs);
      if (typeof result !== 'undefined') {
        ctx = result;
      }
    }
  }
}
