
import enJson from '../assets/locales/en.json' with { type: 'json' };

export const en = enJson as any;

export class Localization {
  localize(path: string): string {
    path = 'en.' + path;
    const parts = path.split('.');
    let cursor = en;
    for (const part of parts) {
      cursor = cursor[part];
    }
    return cursor;
  }
}
