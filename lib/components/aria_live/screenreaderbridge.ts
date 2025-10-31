/*
Code URL: https://github.com/spmealin/screen-reader-bridge

MIT License

Copyright (c) 2023 Sean Mealin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * A class that will handle passing text to screen readers to speak.
 * When a user of this class passes in a "caption" element, the renderer will add a child element to the caption for
 * each string that the screen reader should speak. The renderer will also remove old child nodes when a new string is
 * spoken.
 * The "caption" element must have a specific list of aria attributes to properly work, see the static method
 * "addAriaAttributes" for more details.
 * @internal
 */
export class ScreenReaderBridge {
  private static readonly PADDING_CHARACTER = '\u00A0'; // no-break space
  private static readonly REMOVAL_DELAY = 25; // Wait 25 ms before removing hidden elements
  public static readonly ORIGINAL_TEXT_ATTRIBUTE = 'data-original-text';

  private readonly _element: HTMLElement;
  private readonly _maxNumPaddingCharacters = 3;
  private _numPaddingCharacters = 0;
  protected _lastCreatedElement: HTMLElement | null;

  /**
   * Add the required aria attributes to an element for screen readers to properly work.
   * In order for the greatest number of screen reader and browser combinations to work, the following attributes must
   * be set on the element:
   * aria-live: assertive
   * roll: status
   * aria-atomic: true
   * aria-relevant: additions text
   * For the aria-live attribute, "polite" may also work, but that will create a queue of messages for the screen
   * reader to read out one after another which is probably not what you want.
   * @param element - the "caption" element which will host the messages for the screen reader to speak
   * @param [ariaLive] - the politeness of the aria-live attribute, one of "off", "assertive", or "polite"
   * @static
   */
  public static addAriaAttributes(
    element: HTMLElement,
    ariaLive = 'assertive'
  ): void {
    element.setAttribute('aria-live', ariaLive);
    element.setAttribute('role', 'status');
    //element.setAttribute('aria-atomic', 'true');
    element.setAttribute('aria-relevant', 'additions text');
  }

  /**
   * Create a ScreenReaderBridge instance.
   * @param captionElement - the "caption" element, typically a span or div element
   */
  public constructor(captionElement: HTMLElement) {
    this._element = captionElement;
    this._lastCreatedElement = null;
  }

  /**
   * The last created child element of the "caption" element.
   */
  public get lastCreatedElement(): HTMLElement | null {
    return this._lastCreatedElement;
  }

  /**
   * Clear the contents of the live region
   */
  public clear(): void {
    this._element.innerHTML = '';
  }

  /**
   * Insert the provided text into the aria-live region.
   * @param text - the text to inserts
   */
  public render(text: string): void {
    // Pad the text with the padding character.
    const paddedText = this._createPaddedText(text);
    // Create the new element.
    const divElement = document.createElement('div');
    divElement.textContent = paddedText;
    divElement.setAttribute(
      ScreenReaderBridge.ORIGINAL_TEXT_ATTRIBUTE,
      text
    );
    divElement.setAttribute('data-created', Date.now().toString());
    // If there is a previous element, delete old elements and add it to the list to be deleted in the future.
    if (this.lastCreatedElement) {
      this._removeOldElements();
      this.lastCreatedElement.style.display = 'none';
    }
    // Show the new element wit the text.
    this._element.appendChild(divElement);
    this._lastCreatedElement = divElement;
  }

  /**
   * Pad the provided text with the padding character.
   * Padding the text tricks screen readers into speaking it, even if they think it should be suppressed.
   * @param text - the text to pad
   * @private
   */
  private _createPaddedText(text: string): string {
    let padding = '';
    for (let i = 0; i < this._numPaddingCharacters; i++) {
      padding += ScreenReaderBridge.PADDING_CHARACTER;
    }
    // Increase the number of padding characters for the next call to this method.
    this._numPaddingCharacters =
      (this._numPaddingCharacters + 1) % this._maxNumPaddingCharacters;
    return text + padding;
  }

  /**
   * Remove any hidden elements that were hidden longer than the set milliseconds.
   * We wait to remove those elements even though they are hidden because some screen readers don't like the DOM
   * changing that much.
   * @private
   */
  private _removeOldElements(): void {
    // Remove old elements or add them to a list if they are too young.
    const curTime = Date.now();
    Array.from(this._element.children).forEach((kid) => {
      const time = Number(kid.getAttribute('data-time'));
      if (curTime - time > ScreenReaderBridge.REMOVAL_DELAY) {
        this._element.removeChild(kid);
      }
    });
  }
}
