// Generated from Liblouis tables/text_nabcc.dis at commit
// 7702f1240e1575f9c19b2b399c6989a267ecca8f (LGPL-2.1-or-later).
// Index N is the six-dot pattern whose dot bits form N; index 0 is blank.
const ASCII_BY_DOTS = " a1b'k2l`cif/msp\"e3h9o6r~djg>ntq,*5<-u8v.%{$+x!&;:4|0z7(_?w}#y)=";

const DOTS_BY_ASCII = new Map<string, number>();
for (const [dots, character] of [...ASCII_BY_DOTS].entries()) {
  DOTS_BY_ASCII.set(character, dots);
  if (character >= 'a' && character <= 'z') {
    DOTS_BY_ASCII.set(character.toUpperCase(), dots);
  }
}

/** Convert ASCII using the simple NABCC cmap to Unicode Braille patterns. */
export function nabccToUnicode(text: string): string {
  let output = '';
  for (const character of text) {
    const dots = DOTS_BY_ASCII.get(character);
    output += dots === undefined ? character : String.fromCodePoint(0x2800 + dots);
  }
  return output;
}
