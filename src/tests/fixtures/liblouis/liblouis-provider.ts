import type { BrailleTranslationProvider } from '../../../../lib';
import LibLouisWASM from './vendor/liblouis-runtime/liblouisWASM.js';
import wasmUrl from './vendor/liblouis-runtime/liblouisWASM.wasm?url';
import dataUrl from './vendor/liblouis-runtime/liblouisWASM.data?url';
import { nabccToUnicode } from '../../../../lib/braille/nabcc_to_unicode';

interface LibLouisModule {
  _malloc(size: number): number;
  _free(pointer: number): void;
  cwrap(name: string, returnType: string, argumentTypes: string[]): (...args: unknown[]) => unknown;
  stringToUTF16(value: string, pointer: number, maxBytes: number): void;
  UTF16ToString(pointer: number, maxBytes: number): string;
  setValue(pointer: number, value: number, type: string): void;
  getValue(pointer: number, type: string): number;
}

const TABLE = '/tables/en-ueb-g2.ctb';

let modulePromise: Promise<void> | undefined;
let module: LibLouisModule | undefined;
let translateString: ((...args: unknown[]) => unknown) | undefined;

function locateFile(name: string): string {
  if (name === 'liblouisWASM.wasm') return wasmUrl;
  if (name === 'liblouisWASM.data') return dataUrl;
  throw new Error(`Unexpected Liblouis asset request: ${name}`);
}

async function ready(): Promise<void> {
  modulePromise ??= LibLouisWASM({ locateFile })
    .then((initialized: LibLouisModule) => {
      module = initialized;
      translateString = initialized.cwrap(
        'lou_translateString',
        'number',
        ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      );
    })
    .catch((error: unknown) => {
      modulePromise = undefined;
      module = undefined;
      translateString = undefined;
      throw error;
    });
  await modulePromise;
}

function translate(text: string): string {
  if (!text) return text;
  if (!module || !translateString) {
    throw new Error('Liblouis is not ready; await provider.ready() before translation');
  }

  const inputBytes = (text.length + 1) * 2;
  const outputCapacity = Math.max(16, text.length * 4);
  const inputPointer = module._malloc(inputBytes);
  const outputPointer = module._malloc((outputCapacity + 1) * 2);
  const inputLengthPointer = module._malloc(4);
  const outputLengthPointer = module._malloc(4);

  try {
    module.stringToUTF16(`${text}\0`, inputPointer, inputBytes);
    module.setValue(inputLengthPointer, text.length, 'i32');
    module.setValue(outputLengthPointer, outputCapacity, 'i32');
    const succeeded = translateString(
      TABLE,
      inputPointer,
      inputLengthPointer,
      outputPointer,
      outputLengthPointer,
      0,
      0,
      0,
    );
    if (!succeeded) {
      throw new Error(`Liblouis failed to translate with ${TABLE}`);
    }
    const outputLength = module.getValue(outputLengthPointer, 'i32');
    return nabccToUnicode(module.UTF16ToString(outputPointer, outputLength * 2));
  } finally {
    module._free(inputPointer);
    module._free(outputPointer);
    module._free(inputLengthPointer);
    module._free(outputLengthPointer);
  }
}

/** Browser-test Liblouis provider. The ParaCharts package does not depend on it. */
export const liblouisBrailleProvider: BrailleTranslationProvider = {
  ready,
  translate,
};
