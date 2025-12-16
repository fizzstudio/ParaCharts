import { describe, test, expect } from 'vitest';
import { lexParaActions, ParseError } from '../../lib/paraactions/paraactions';

// Helper to make test expectations more readable
type TokenKind = 'identifier' | 'number' | 'string' | 'boolean' | 'null' | 'dot' | 'lparen' | 'rparen' | 'comma' | 'actionSep' | 'doubleColon' | 'eof';

interface ExpectedToken {
  kind: TokenKind;
  value?: string | number | boolean | null;
  line?: number;
  column?: number;
}

function expectTokens(input: string, expected: ExpectedToken[]) {
  const tokens = lexParaActions(input);
  
  expect(tokens).toHaveLength(expected.length);
  
  tokens.forEach((token, i) => {
    const exp = expected[i];
    expect(token.kind, `Token ${i} kind mismatch`).toBe(exp.kind);
    
    if (exp.value !== undefined) {
      expect(token.value, `Token ${i} value mismatch`).toEqual(exp.value);
    }
    
    if (exp.line !== undefined) {
      expect(token.line, `Token ${i} line mismatch`).toBe(exp.line);
    }
    
    if (exp.column !== undefined) {
      expect(token.column, `Token ${i} column mismatch`).toBe(exp.column);
    }
  });
}

describe('ParaActions Lexer', () => {
  
  describe('Basic Token Recognition', () => {
    
    describe('Identifiers', () => {
      test('simple identifier', () => {
        expectTokens('foo', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'eof' }
        ]);
      });

      test('method-like identifier', () => {
        expectTokens('getSeries', [
          { kind: 'identifier', value: 'getSeries' },
          { kind: 'eof' }
        ]);
      });

      test('identifier with underscore', () => {
        expectTokens('_private', [
          { kind: 'identifier', value: '_private' },
          { kind: 'eof' }
        ]);
      });

      test('identifier with numbers', () => {
        expectTokens('var123', [
          { kind: 'identifier', value: 'var123' },
          { kind: 'eof' }
        ]);
      });

      test('camelCase identifier', () => {
        expectTokens('camelCase', [
          { kind: 'identifier', value: 'camelCase' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Keywords (boolean/null)', () => {
      test('true keyword', () => {
        expectTokens('true', [
          { kind: 'boolean', value: true },
          { kind: 'eof' }
        ]);
      });

      test('false keyword', () => {
        expectTokens('false', [
          { kind: 'boolean', value: false },
          { kind: 'eof' }
        ]);
      });

      test('null keyword', () => {
        expectTokens('null', [
          { kind: 'null', value: null },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Numbers', () => {
      test('zero', () => {
        expectTokens('0', [
          { kind: 'number', value: 0 },
          { kind: 'eof' }
        ]);
      });

      test('positive integer', () => {
        expectTokens('123', [
          { kind: 'number', value: 123 },
          { kind: 'eof' }
        ]);
      });

      test('negative integer', () => {
        expectTokens('-42', [
          { kind: 'number', value: -42 },
          { kind: 'eof' }
        ]);
      });

      test('decimal number', () => {
        expectTokens('3.14', [
          { kind: 'number', value: 3.14 },
          { kind: 'eof' }
        ]);
      });

      test('negative decimal', () => {
        expectTokens('-99.5', [
          { kind: 'number', value: -99.5 },
          { kind: 'eof' }
        ]);
      });

      test('decimal starting with 0', () => {
        expectTokens('0.5', [
          { kind: 'number', value: 0.5 },
          { kind: 'eof' }
        ]);
      });
    });

    describe('String Literals (double quotes)', () => {
      test('simple string', () => {
        expectTokens('"hello"', [
          { kind: 'string', value: 'hello' },
          { kind: 'eof' }
        ]);
      });

      test('capitalized string', () => {
        expectTokens('"Revenue"', [
          { kind: 'string', value: 'Revenue' },
          { kind: 'eof' }
        ]);
      });

      test('empty string', () => {
        expectTokens('""', [
          { kind: 'string', value: '' },
          { kind: 'eof' }
        ]);
      });

      test('string with spaces', () => {
        expectTokens('"with spaces"', [
          { kind: 'string', value: 'with spaces' },
          { kind: 'eof' }
        ]);
      });

      test('string with parentheses', () => {
        expectTokens('"with (parens)"', [
          { kind: 'string', value: 'with (parens)' },
          { kind: 'eof' }
        ]);
      });

      test('string with commas', () => {
        expectTokens('"with, commas"', [
          { kind: 'string', value: 'with, commas' },
          { kind: 'eof' }
        ]);
      });

      test('string with dots', () => {
        expectTokens('"with.dots"', [
          { kind: 'string', value: 'with.dots' },
          { kind: 'eof' }
        ]);
      });

      test('string with semicolons', () => {
        expectTokens('"with;semicolons"', [
          { kind: 'string', value: 'with;semicolons' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('String Literals (single quotes)', () => {
      test('simple string', () => {
        expectTokens("'hello'", [
          { kind: 'string', value: 'hello' },
          { kind: 'eof' }
        ]);
      });

      test('capitalized string', () => {
        expectTokens("'Revenue'", [
          { kind: 'string', value: 'Revenue' },
          { kind: 'eof' }
        ]);
      });

      test('empty string', () => {
        expectTokens("''", [
          { kind: 'string', value: '' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Punctuation', () => {
      test('dot', () => {
        expectTokens('.', [
          { kind: 'dot' },
          { kind: 'eof' }
        ]);
      });

      test('left paren', () => {
        expectTokens('(', [
          { kind: 'lparen' },
          { kind: 'eof' }
        ]);
      });

      test('right paren', () => {
        expectTokens(')', [
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('comma', () => {
        expectTokens(',', [
          { kind: 'comma' },
          { kind: 'eof' }
        ]);
      });

      test('double colon', () => {
        expectTokens('::', [
          { kind: 'doubleColon' },
          { kind: 'eof' }
        ]);
      });

      test('semicolon', () => {
        expectTokens(';', [
          { kind: 'actionSep' },
          { kind: 'eof' }
        ]);
      });
    });
  });

  describe('Whitespace Handling', () => {
    
    describe('Whitespace within expressions (should NOT create actionSep)', () => {
      test('space before parens', () => {
        expectTokens('foo ()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('space inside parens', () => {
        expectTokens('foo( )', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('trailing space after call', () => {
        expectTokens('foo () ', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('space before dot in chain', () => {
        expectTokens('foo() .bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('space after dot in chain', () => {
        expectTokens('foo(). bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('spaces around dot in chain', () => {
        expectTokens('foo() . bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Whitespace between expressions (SHOULD create actionSep)', () => {
      test('single space between calls', () => {
        expectTokens('foo() bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('multiple spaces between calls', () => {
        expectTokens('foo()  bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('tab between calls', () => {
        expectTokens('foo()\tbar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Newlines', () => {
      test('newline between calls', () => {
        expectTokens('foo()\nbar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('multiple newlines', () => {
        expectTokens('foo()\n\nbar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('CRLF line endings', () => {
        expectTokens('foo()\r\nbar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Leading/trailing whitespace', () => {
      test('leading spaces', () => {
        expectTokens('  foo()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('trailing spaces', () => {
        expectTokens('foo()  ', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('both leading and trailing spaces', () => {
        expectTokens('  foo()  ', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Semicolons (always actionSep)', () => {
      test('semicolon without spaces', () => {
        expectTokens('foo();bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('semicolon with space after', () => {
        expectTokens('foo(); bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('semicolon with spaces around', () => {
        expectTokens('foo() ; bar()', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });
  });

  describe('Complex Expressions', () => {
    
    describe('Method calls', () => {
      test('no-arg method call', () => {
        expectTokens('reset()', [
          { kind: 'identifier', value: 'reset' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with string arg', () => {
        expectTokens('getSeries("Revenue")', [
          { kind: 'identifier', value: 'getSeries' },
          { kind: 'lparen' },
          { kind: 'string', value: 'Revenue' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with two number args, no spaces', () => {
        expectTokens('setRange(0,100)', [
          { kind: 'identifier', value: 'setRange' },
          { kind: 'lparen' },
          { kind: 'number', value: 0 },
          { kind: 'comma' },
          { kind: 'number', value: 100 },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with two number args, with spaces', () => {
        expectTokens('setRange(0, 100)', [
          { kind: 'identifier', value: 'setRange' },
          { kind: 'lparen' },
          { kind: 'number', value: 0 },
          { kind: 'comma' },
          { kind: 'number', value: 100 },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with three number args', () => {
        expectTokens('foo(1,2,3)', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'number', value: 1 },
          { kind: 'comma' },
          { kind: 'number', value: 2 },
          { kind: 'comma' },
          { kind: 'number', value: 3 },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with boolean and null args', () => {
        expectTokens('foo(true, false, null)', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'boolean', value: true },
          { kind: 'comma' },
          { kind: 'boolean', value: false },
          { kind: 'comma' },
          { kind: 'null', value: null },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('method with identifier args', () => {
        expectTokens('foo(bar, baz)', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'lparen' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'comma' },
          { kind: 'identifier', value: 'baz' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Chained method calls', () => {
      test('simple chain', () => {
        expectTokens('getSeries().highlight()', [
          { kind: 'identifier', value: 'getSeries' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'highlight' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('chain with args', () => {
        expectTokens('getSeries("Revenue").highlight()', [
          { kind: 'identifier', value: 'getSeries' },
          { kind: 'lparen' },
          { kind: 'string', value: 'Revenue' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'highlight' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('three-method chain', () => {
        expectTokens('a().b().c()', [
          { kind: 'identifier', value: 'a' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'b' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'c' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('chain with args on each method', () => {
        expectTokens('a(1).b(2).c(3)', [
          { kind: 'identifier', value: 'a' },
          { kind: 'lparen' },
          { kind: 'number', value: 1 },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'b' },
          { kind: 'lparen' },
          { kind: 'number', value: 2 },
          { kind: 'rparen' },
          { kind: 'dot' },
          { kind: 'identifier', value: 'c' },
          { kind: 'lparen' },
          { kind: 'number', value: 3 },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('URL-safe syntax (::)', () => {
      test('double colon with identifier', () => {
        expectTokens('foo::bar', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'doubleColon' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'eof' }
        ]);
      });

      test('double colon with string', () => {
        expectTokens('foo::"Revenue"', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'doubleColon' },
          { kind: 'string', value: 'Revenue' },
          { kind: 'eof' }
        ]);
      });

      test('double colon with multiple args', () => {
        expectTokens('foo::1,2,3', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'doubleColon' },
          { kind: 'number', value: 1 },
          { kind: 'comma' },
          { kind: 'number', value: 2 },
          { kind: 'comma' },
          { kind: 'number', value: 3 },
          { kind: 'eof' }
        ]);
      });

      test('double colon with identifier args', () => {
        expectTokens('foo::bar,baz', [
          { kind: 'identifier', value: 'foo' },
          { kind: 'doubleColon' },
          { kind: 'identifier', value: 'bar' },
          { kind: 'comma' },
          { kind: 'identifier', value: 'baz' },
          { kind: 'eof' }
        ]);
      });
    });

    describe('Multiple actions on one line', () => {
      test('space-separated actions', () => {
        expectTokens('reset() clear()', [
          { kind: 'identifier', value: 'reset' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'clear' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('semicolon-separated actions', () => {
        expectTokens('reset(); clear()', [
          { kind: 'identifier', value: 'reset' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'clear' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });

      test('three actions on one line', () => {
        expectTokens('reset() clear() refresh()', [
          { kind: 'identifier', value: 'reset' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'clear' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'actionSep' },
          { kind: 'identifier', value: 'refresh' },
          { kind: 'lparen' },
          { kind: 'rparen' },
          { kind: 'eof' }
        ]);
      });
    });
  });

  describe('Edge Cases from PR Review', () => {
    
    test('space before dot should not break chain', () => {
      expectTokens('foo() .bar()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'dot' },
        { kind: 'identifier', value: 'bar' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('space after dot should not break chain', () => {
      expectTokens('foo(). bar()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'dot' },
        { kind: 'identifier', value: 'bar' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('spaces around dot should not break chain', () => {
      expectTokens('foo() . bar()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'dot' },
        { kind: 'identifier', value: 'bar' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('space after method name should not break', () => {
      expectTokens('foo ()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('multiple spaces after method name', () => {
      expectTokens('foo  ()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('tab after method name', () => {
      expectTokens('foo\t()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('commands without whitespace should parse', () => {
      expectTokens('foo()bar()', [
        { kind: 'identifier', value: 'foo' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'actionSep' },
        { kind: 'identifier', value: 'bar' },
        { kind: 'lparen' },
        { kind: 'rparen' },
        { kind: 'eof' }
      ]);
    });

    test('string with parentheses', () => {
      expectTokens('"US (except trucks) sales"', [
        { kind: 'string', value: 'US (except trucks) sales' },
        { kind: 'eof' }
      ]);
    });

    test('string with commas', () => {
      expectTokens('"Last Name, First Name"', [
        { kind: 'string', value: 'Last Name, First Name' },
        { kind: 'eof' }
      ]);
    });

    test('string with dots', () => {
      expectTokens('"api.method.chain"', [
        { kind: 'string', value: 'api.method.chain' },
        { kind: 'eof' }
      ]);
    });

    test('multiline string', () => {
      expectTokens('"line1\nline2"', [
        { kind: 'string', value: 'line1\nline2' },
        { kind: 'eof' }
      ]);
    });
  });

  describe('Line/Column Tracking', () => {
    
    test('single line tokens have line 1', () => {
      const tokens = lexParaActions('foo()');
      tokens.forEach(token => {
        expect(token.line).toBe(1);
      });
    });

    test('tokens on different lines', () => {
      const tokens = lexParaActions('foo()\nbar()');
      expect(tokens[0].line).toBe(1); // foo
      expect(tokens[1].line).toBe(1); // (
      expect(tokens[2].line).toBe(1); // )
      expect(tokens[3].line).toBe(1); // actionSep
      expect(tokens[4].line).toBe(2); // bar
      expect(tokens[5].line).toBe(2); // (
      expect(tokens[6].line).toBe(2); // )
    });

    test('paren spanning lines', () => {
      const tokens = lexParaActions('foo(\n)');
      expect(tokens[0].line).toBe(1); // foo
      expect(tokens[1].line).toBe(1); // (
      expect(tokens[2].line).toBe(2); // )
    });
  });

  describe('Empty/Whitespace Input', () => {
    
    test('empty string', () => {
      expectTokens('', [
        { kind: 'eof' }
      ]);
    });

    test('spaces only', () => {
      expectTokens('   ', [
        { kind: 'eof' }
      ]);
    });

    test('newlines only', () => {
      expectTokens('\n\n', [
        { kind: 'eof' }
      ]);
    });

    test('tabs only', () => {
      expectTokens('\t\t\t', [
        { kind: 'eof' }
      ]);
    });

    test('mixed whitespace only', () => {
      expectTokens('  \n  \t  \n  ', [
        { kind: 'eof' }
      ]);
    });
  });

  describe('Error Cases - Should Throw ParseError', () => {
    
    describe('Unterminated strings', () => {
      test('unterminated double quote', () => {
        expect(() => lexParaActions('"unclosed'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('"unclosed');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain('Unterminated string literal');
          expect((e as ParseError).line).toBe(1);
          expect((e as ParseError).column).toBe(1);
        }
      });

      test('unterminated single quote', () => {
        expect(() => lexParaActions("'unclosed"))
          .toThrow(ParseError);
        
        try {
          lexParaActions("'unclosed");
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain('Unterminated string literal');
        }
      });

      test('unterminated string in function call', () => {
        expect(() => lexParaActions('foo("unclosed)'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo("unclosed)');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).line).toBe(1);
          expect((e as ParseError).column).toBe(5);
        }
      });

      test('unterminated string in getSeries', () => {
        expect(() => lexParaActions('getSeries("Revenue'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('getSeries("Revenue');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).column).toBe(11);
        }
      });
    });

    describe('Mismatched quotes', () => {
      test('double quote opened, single quote in middle', () => {
        expect(() => lexParaActions('"mixed\''))
          .toThrow(ParseError);
      });

      test('single quote opened, double quote in middle', () => {
        expect(() => lexParaActions('\'mixed"'))
          .toThrow(ParseError);
      });
    });

    describe('Single colon errors', () => {
      test('single colon alone', () => {
        expect(() => lexParaActions(':'))
          .toThrow(ParseError);
        
        try {
          lexParaActions(':');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain("did you mean '::'");
          expect((e as ParseError).line).toBe(1);
          expect((e as ParseError).column).toBe(1);
        }
      });

      test('single colon between identifiers', () => {
        expect(() => lexParaActions('foo:bar'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo:bar');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain("did you mean '::'");
          expect((e as ParseError).column).toBe(4);
        }
      });

      test('single colon in expression', () => {
        expect(() => lexParaActions('getSeries(revenue):highlight()'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('getSeries(revenue):highlight()');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).column).toBe(18);
        }
      });
    });

    describe('Invalid characters', () => {
      test('at symbol', () => {
        expect(() => lexParaActions('@'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('@');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain("Unexpected character '@'");
        }
      });

      test('hash symbol', () => {
        expect(() => lexParaActions('#'))
          .toThrow(ParseError);
      });

      test('dollar sign', () => {
        expect(() => lexParaActions('$'))
          .toThrow(ParseError);
      });

      test('percent sign', () => {
        expect(() => lexParaActions('%'))
          .toThrow(ParseError);
      });

      test('ampersand', () => {
        expect(() => lexParaActions('&'))
          .toThrow(ParseError);
      });

      test('asterisk', () => {
        expect(() => lexParaActions('*'))
          .toThrow(ParseError);
      });

      test('invalid char in identifier', () => {
        expect(() => lexParaActions('foo@bar'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo@bar');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).column).toBe(4);
        }
      });

      test('invalid char after method call', () => {
        expect(() => lexParaActions('getSeries()@highlight()'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('getSeries()@highlight()');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).column).toBe(12);
        }
      });
    });

    describe('Invalid numbers', () => {
      test('lone minus sign', () => {
        expect(() => lexParaActions('-'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('-');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).message).toContain('Invalid number literal');
        }
      });

      test('double minus', () => {
        expect(() => lexParaActions('--5'))
          .toThrow(ParseError);
      });

      test('minus dot', () => {
        expect(() => lexParaActions('-.5'))
          .toThrow(ParseError);
      });

      test('invalid number in function call', () => {
        expect(() => lexParaActions('foo(--5)'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo(--5)');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).column).toBe(5);
        }
      });
    });

    describe('Unterminated strings with newlines', () => {
      test('unterminated with one newline', () => {
        expect(() => lexParaActions('"line1\nline2'))
          .toThrow(ParseError);
      });

      test('unterminated with multiple newlines', () => {
        expect(() => lexParaActions("'start\n\nend"))
          .toThrow(ParseError);
      });
    });

    describe('Error position tracking on multi-line input', () => {
      test('error on line 3', () => {
        expect(() => lexParaActions('foo()\nbar()\n@'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo()\nbar()\n@');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).line).toBe(3);
          expect((e as ParseError).column).toBe(1);
        }
      });

      test('error on line 2 with indentation', () => {
        expect(() => lexParaActions('getSeries()\n  .getPoint(@)'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('getSeries()\n  .getPoint(@)');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).line).toBe(2);
          expect((e as ParseError).column).toBe(13);
        }
      });

      test('unterminated string on line 2', () => {
        expect(() => lexParaActions('foo()\nbar("unclosed)'))
          .toThrow(ParseError);
        
        try {
          lexParaActions('foo()\nbar("unclosed)');
        } catch (e) {
          expect(e).toBeInstanceOf(ParseError);
          expect((e as ParseError).line).toBe(2);
          expect((e as ParseError).column).toBe(5);
        }
      });
    });
  });
});
