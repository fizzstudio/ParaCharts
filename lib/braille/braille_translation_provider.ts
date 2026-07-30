/** Braille grades supported by ParaCharts tactile labels. @public */
export type BrailleGrade = 1 | 2;

/**
 * Translates print text to Grade 2 Unicode Braille Pattern characters.
 * `translate` is called synchronously only after `ready` resolves.
 * @public
 */
export interface BrailleTranslationProvider {
  /** Load and initialize the translation runtime and tables. */
  ready(): Promise<void>;
  /** Translate one print-text label to Grade 2 Unicode Braille. */
  translate(text: string): string;
}
