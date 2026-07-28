import { describe, expect, it, vi } from 'vitest';

import { BrailleTranslationService } from '../../../../lib/braille/braille_translation_service';

describe('BrailleTranslationService', () => {
  it('uses the simple mapping when no provider is registered', () => {
    const service = new BrailleTranslationService();

    expect(service.translate('Ab 1', 1)).toBe('⠁⠃⠀⠂');
    expect(service.translate('Ab 1', 2)).toBe('⠁⠃⠀⠂');
  });

  it('uses and caches a ready literary provider', async () => {
    const translate = vi.fn(() => '⠿');
    const service = new BrailleTranslationService();
    await service.register({ ready: async () => {}, translate });

    expect(service.translate('Chart', 2)).toBe('⠿');
    expect(service.translate('Chart', 2)).toBe('⠿');
    expect(translate).toHaveBeenCalledOnce();
  });

  it('keeps Grade 1 on the simple mapping when a provider is registered', async () => {
    const translate = vi.fn(() => '⠿');
    const service = new BrailleTranslationService();
    await service.register({ ready: async () => {}, translate });

    expect(service.translate('Ab', 1)).toBe('⠁⠃');
    expect(translate).not.toHaveBeenCalled();
  });

  it('routes a Grade 2 value originating from a dropdown to the provider', async () => {
    const translate = vi.fn(() => '⠿');
    const service = new BrailleTranslationService();
    await service.register({ ready: async () => {}, translate });

    expect(service.translate('Ab', '2' as unknown as 2)).toBe('⠿');
    expect(translate).toHaveBeenCalledOnce();
  });

  it('restores the fallback after provider initialization fails', async () => {
    const service = new BrailleTranslationService();
    await expect(service.register({
      ready: async () => { throw new Error('failed'); },
      translate: text => text,
    })).rejects.toThrow('failed');

    expect(service.translate('Ab', 2)).toBe('⠁⠃');
  });

  it('falls back without caching when a provider cannot translate a label', async () => {
    const translate = vi.fn()
      .mockImplementationOnce(() => { throw new Error('unsupported label'); })
      .mockReturnValue('⠉');
    const service = new BrailleTranslationService();
    await service.register({
      ready: async () => {},
      translate,
    });

    expect(service.translate('Ab', 2)).toBe('⠁⠃');
    expect(service.translate('Ab', 2)).toBe('⠉');
    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('falls back when a provider returns non-Braille output', async () => {
    const service = new BrailleTranslationService();
    await service.register({
      ready: async () => {},
      translate: () => 'not braille',
    });

    expect(service.translate('Ab', 2)).toBe('⠁⠃');
  });
});
