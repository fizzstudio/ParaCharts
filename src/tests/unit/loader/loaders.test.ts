import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadManifestFromAttributes,
  loadManifestFromManifestAttribute,
  loadManifestFromElementById,
  loadManifestFromSlotElement,
  type Attributes,
} from '../../../../lib/loader/loaders';

describe('Manifest Source Loaders', () => {
  
  describe('loadManifestFromAttributes', () => {
    it('should return empty object when no manifest-related attributes exist', async () => {
      const attributes: Attributes = {};
      const result = await loadManifestFromAttributes(attributes);
      expect(result).toEqual({});
    });

    it('should extract type attribute to manifest.datasets[0].type', async () => {
      const attributes: Attributes = {
        type: 'line'
      };
      const result = await loadManifestFromAttributes(attributes);
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('line');
    });

    it('should extract summary attribute to manifest.datasets[0].description', async () => {
      const attributes: Attributes = {
        summary: 'Test chart description'
      };
      const result = await loadManifestFromAttributes(attributes);
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.description).toBe('Test chart description');
    });

    it('should return partial manifest with only the fields present in attributes', async () => {
      const attributes: Attributes = {
        type: 'bar',
        summary: 'Sales data'
      };
      const result = await loadManifestFromAttributes(attributes);
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('bar');
      expect(result?.datasets?.[0]?.description).toBe('Sales data');
      // Should not have other fields
      expect(result?.datasets?.[0]?.series).toBeUndefined();
    });
  });

  describe('loadManifestFromManifestAttribute', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should return empty object when manifest attribute does not exist', async () => {
      const attributes: Attributes = {};
      const result = await loadManifestFromManifestAttribute(attributes);
      expect(result).toEqual({});
    });

    it('should detect and parse JSON content (starts with {)', async () => {
      const jsonContent = '{"datasets":[{"type":"line","title":"Test"}]}';
      const attributes: Attributes = {
        manifest: jsonContent
      };
      const result = await loadManifestFromManifestAttribute(attributes);
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('line');
      expect(result?.datasets?.[0]?.title).toBe('Test');
    });

    it('should detect and parse JSON content (starts with [)', async () => {
      const jsonContent = '[{"type":"bar","title":"Array Test"}]';
      const attributes: Attributes = {
        manifest: jsonContent
      };
      const result = await loadManifestFromManifestAttribute(attributes);
      expect(result).not.toBeNull();
      // Should handle array format appropriately
    });

    it('should detect and fetch file path (ends with .json)', async () => {
      const mockManifest = {
        datasets: [{
          type: 'line',
          title: 'Fetched Manifest'
        }]
      };
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockManifest)
      });
      globalThis.fetch = mockFetch;

      const attributes: Attributes = {
        manifest: '/src/demo-data/test-manifest.json'
      };
      const result = await loadManifestFromManifestAttribute(attributes);
      
      expect(mockFetch).toHaveBeenCalledWith('/src/demo-data/test-manifest.json');
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('line');
    });

    it('should prepend cwd to file path when provided', async () => {
      const mockManifest = { datasets: [{ type: 'bar' }] };
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockManifest)
      });
      globalThis.fetch = mockFetch;

      const attributes: Attributes = {
        manifest: 'manifest.json',
        cwd: '/data/'
      };
      const result = await loadManifestFromManifestAttribute(attributes);
      
      expect(mockFetch).toHaveBeenCalledWith('/data/manifest.json');
    });

    it('should handle fetch errors gracefully (file not found)', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      globalThis.fetch = mockFetch;

      const attributes: Attributes = {
        manifest: '/nonexistent.json'
      };
      
      await expect(loadManifestFromManifestAttribute(attributes)).rejects.toThrow();
    });

    it('should handle JSON parse errors gracefully (malformed JSON)', async () => {
      const attributes: Attributes = {
        manifest: '{invalid json content}'
      };
      
      await expect(loadManifestFromManifestAttribute(attributes)).rejects.toThrow();
    });
  });

  describe('loadManifestFromElementById', () => {
    afterEach(() => {
      // Clean up any created elements
      document.body.innerHTML = '';
    });

    it('should return empty object when manifestId attribute does not exist', async () => {
      const attributes: Attributes = {};
      const result = await loadManifestFromElementById(attributes);
      expect(result).toEqual({});
    });

    it('should return empty object when element with that ID does not exist', async () => {
      const attributes: Attributes = {
        manifestId: 'nonexistent-id'
      };
      const result = await loadManifestFromElementById(attributes);
      expect(result).toEqual({});
    });

    it('should load from src attribute when present (fetch + parse)', async () => {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'test-manifest';
      scriptEl.setAttribute('src', '/data/manifest.json');
      document.body.appendChild(scriptEl);

      const mockManifest = { datasets: [{ type: 'scatter', title: 'From Src' }] };
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockManifest)
      });
      globalThis.fetch = mockFetch;

      const attributes: Attributes = {
        manifestId: 'test-manifest'
      };
      const result = await loadManifestFromElementById(attributes);
      
      expect(mockFetch).toHaveBeenCalledWith('/data/manifest.json');
      expect(result?.datasets?.[0]?.type).toBe('scatter');
    });

    it('should load from innerHTML when no src attribute', async () => {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'inline-manifest';
      scriptEl.type = 'application/json';
      scriptEl.innerHTML = '{"datasets":[{"type":"pie","title":"Inline"}]}';
      document.body.appendChild(scriptEl);

      const attributes: Attributes = {
        manifestId: 'inline-manifest'
      };
      const result = await loadManifestFromElementById(attributes);
      
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('pie');
      expect(result?.datasets?.[0]?.title).toBe('Inline');
    });

    it('should handle both src and innerHTML correctly (src takes precedence)', async () => {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'both-manifest';
      scriptEl.setAttribute('src', '/data/manifest.json');
      scriptEl.innerHTML = '{"datasets":[{"type":"line"}]}';
      document.body.appendChild(scriptEl);

      const mockManifest = { datasets: [{ type: 'bar', title: 'From Src' }] };
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockManifest)
      });
      globalThis.fetch = mockFetch;

      const attributes: Attributes = {
        manifestId: 'both-manifest'
      };
      const result = await loadManifestFromElementById(attributes);
      
      // src should take precedence
      expect(result?.datasets?.[0]?.type).toBe('bar');
    });
  });

  describe('loadManifestFromSlotElement', () => {
    it('should return empty object when no slotElements provided', async () => {
      const attributes: Attributes = {};
      const result = await loadManifestFromSlotElement(attributes);
      expect(result).toEqual({});
    });

    it('should return empty object when slotElements is empty array', async () => {
      const attributes: Attributes = {};
      const result = await loadManifestFromSlotElement(attributes, undefined, []);
      expect(result).toEqual({});
    });

    it('should return empty object when no element with class manifest exists', async () => {
      const divEl = document.createElement('div');
      divEl.className = 'other-class';
      
      const attributes: Attributes = {};
      const result = await loadManifestFromSlotElement(attributes, undefined, [divEl]);
      expect(result).toEqual({});
    });

    it('should parse innerHTML of element with class manifest', async () => {
      const manifestEl = document.createElement('div');
      manifestEl.className = 'manifest';
      manifestEl.innerHTML = '{"datasets":[{"type":"waterfall","title":"Slot Manifest"}]}';
      
      const attributes: Attributes = {};
      const result = await loadManifestFromSlotElement(attributes, undefined, [manifestEl]);
      
      expect(result).not.toBeNull();
      expect(result?.datasets?.[0]?.type).toBe('waterfall');
      expect(result?.datasets?.[0]?.title).toBe('Slot Manifest');
    });

    it('should find manifest element among multiple slot elements', async () => {
      const tableEl = document.createElement('table');
      const manifestEl = document.createElement('script');
      manifestEl.className = 'manifest';
      manifestEl.innerHTML = '{"datasets":[{"type":"heatmap"}]}';
      const divEl = document.createElement('div');
      
      const attributes: Attributes = {};
      const result = await loadManifestFromSlotElement(
        attributes, 
        undefined, 
        [tableEl, manifestEl, divEl]
      );
      
      expect(result?.datasets?.[0]?.type).toBe('heatmap');
    });

    it('should handle JSON parse errors gracefully', async () => {
      const manifestEl = document.createElement('div');
      manifestEl.className = 'manifest';
      manifestEl.innerHTML = '{invalid json}';
      
      const attributes: Attributes = {};
      
      await expect(
        loadManifestFromSlotElement(attributes, undefined, [manifestEl])
      ).rejects.toThrow();
    });
  });
});
