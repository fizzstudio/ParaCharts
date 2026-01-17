import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParaState, datapointIdToCursor, makeDatapointId, makeSequenceId } from '../../../../lib/state/parastate';

describe('ParaState', () => {

  describe('Utility Functions', () => {
    it('should create datapoint ID from seriesKey and index', () => {
      const id = makeDatapointId('series1', 5);
      expect(id).toBe('series1-5');
    });

    it('should parse datapoint ID to cursor', () => {
      const cursor = datapointIdToCursor('series1-10');
      expect(cursor).toEqual({ seriesKey: 'series1', index: 10 });
    });

    it('should create sequence ID from seriesKey and indices', () => {
      const id = makeSequenceId('series1', 0, 10);
      expect(id).toBe('series1-0-10');
    });
  });

  describe('Initialization', () => {
    it('should initialize with minimal settings', () => {
      const state = new ParaState({});
      expect(state).toBeDefined();
      expect(state.settings).toBeDefined();
      expect(state.dataState).toBe('initial');
    });

    it('should initialize with custom settings', () => {
      const state = new ParaState({
        'chart.size.width': 1024
      });
      expect(state.settings.chart?.size?.width).toBe(1024);
    });

    it('should register callbacks', () => {
      const state = new ParaState({});
      const onUpdate = vi.fn();
      const onNotice = vi.fn();

      state.registerCallbacks({ onUpdate, onNotice });
      
      state.requestUpdate();
      expect(onUpdate).toHaveBeenCalledOnce();

      state.postNotice('test', { data: 'value' });
      expect(onNotice).toHaveBeenCalledWith('test', { data: 'value' });
    });
  });

  describe('Settings Management', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should update settings using valid path', () => {
      const originalWidth = state.settings.chart?.size?.width;
      
      state.updateSettings(draft => {
        draft.chart!.size!.width = 2048;
      });

      expect(state.settings.chart?.size?.width).toBe(2048);
      expect(state.settings.chart?.size?.width).not.toBe(originalWidth);
    });

    it('should notify observers on setting change', () => {
      const observer = vi.fn();
      state.observeSetting('chart.size.width', observer);

      state.updateSettings(draft => {
        draft.chart!.size!.width = 1920;
      });

      expect(observer).toHaveBeenCalledOnce();
    });

    it('should unobserve settings', () => {
      const observer = vi.fn();
      state.observeSetting('chart.size.width', observer);
      state.unobserveSetting('chart.size.width', observer);

      state.updateSettings(draft => {
        draft.chart!.size!.width = 1920;
      });

      expect(observer).not.toHaveBeenCalled();
    });

    it('should throw when observing same setting twice with same observer', () => {
      const observer = vi.fn();
      state.observeSetting('chart.size.width', observer);

      expect(() => {
        state.observeSetting('chart.size.width', observer);
      }).toThrow(/already registered/);
    });

    it('should throw when unobserving non-existent observer', () => {
      const observer = vi.fn();

      expect(() => {
        state.unobserveSetting('chart.size.width', observer);
      }).toThrow(/no observers/);
    });

    it('should skip observers when ignoreObservers flag is true', () => {
      const observer = vi.fn();
      state.observeSetting('chart.size.width', observer);

      state.updateSettings(draft => {
        draft.chart!.size!.width = 1920;
      }, true);

      expect(observer).not.toHaveBeenCalled();
    });
  });

  describe('Series Visibility - Lowlight', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should lowlight a series', () => {
      state.lowlightSeries('series1');
      expect(state.isSeriesLowlighted('series1')).toBe(true);
    });

    it('should not duplicate lowlighted series', () => {
      state.lowlightSeries('series1');
      state.lowlightSeries('series1');
      expect(state['_lowlightedSeries']).toHaveLength(1);
    });

    it('should clear series lowlight', () => {
      state.lowlightSeries('series1');
      state.clearSeriesLowlight('series1');
      expect(state.isSeriesLowlighted('series1')).toBe(false);
    });

    it('should clear all series lowlights', () => {
      state.lowlightSeries('series1');
      state.lowlightSeries('series2');
      state.clearAllSeriesLowlights();
      expect(state.isSeriesLowlighted('series1')).toBe(false);
      expect(state.isSeriesLowlighted('series2')).toBe(false);
    });
  });

  describe('Series Visibility - Hide', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should hide a series', () => {
      state.hideSeries('series1');
      expect(state.isSeriesHidden('series1')).toBe(true);
    });

    it('should not duplicate hidden series', () => {
      state.hideSeries('series1');
      state.hideSeries('series1');
      expect(state['_hiddenSeries']).toHaveLength(1);
    });

    it('should unhide a series', () => {
      state.hideSeries('series1');
      state.unhideSeries('series1');
      expect(state.isSeriesHidden('series1')).toBe(false);
    });

    it('should unhide all series', () => {
      state.hideSeries('series1');
      state.hideSeries('series2');
      state.unhideAllSeries();
      expect(state.isSeriesHidden('series1')).toBe(false);
      expect(state.isSeriesHidden('series2')).toBe(false);
    });
  });

  describe('Datapoint Highlighting', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should highlight a datapoint', () => {
      state.highlight('series1', 0);
      expect(state.isHighlighted('series1', 0)).toBe(true);
    });

    it('should clear a highlight', () => {
      state.highlight('series1', 0);
      state.clearHighlight('series1', 0);
      expect(state.isHighlighted('series1', 0)).toBe(false);
    });

    it('should clear all highlights', () => {
      state.highlight('series1', 0);
      state.highlight('series2', 1);
      state.clearAllHighlights();
      expect(state.isHighlighted('series1', 0)).toBe(false);
      expect(state.isHighlighted('series2', 1)).toBe(false);
    });

    it('should get highlighted datapoints set', () => {
      state.highlight('series1', 0);
      state.highlight('series1', 1);
      const highlighted = state.highlightedDatapoints;
      expect(highlighted.size).toBe(2);
      expect(highlighted.has('series1-0')).toBe(true);
      expect(highlighted.has('series1-1')).toBe(true);
    });
  });

  describe('Sequence Highlighting', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should highlight a sequence', () => {
      state.highlightSequence('series1', 0, 5);
      const sequences = state.highlightedSequences;
      expect(sequences.has('series1-0-5')).toBe(true);
    });

    it('should clear a sequence highlight', () => {
      state.highlightSequence('series1', 0, 5);
      state.clearSequenceHighlight('series1', 0, 5);
      expect(state.highlightedSequences.size).toBe(0);
    });

    it('should clear all sequence highlights', () => {
      state.highlightSequence('series1', 0, 5);
      state.highlightSequence('series2', 2, 8);
      state.clearAllSequenceHighlights();
      expect(state.highlightedSequences.size).toBe(0);
    });
  });

  describe('Range Highlighting', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should highlight a range', () => {
      state.highlightRange(0.2, 0.8);
      expect(state.rangeHighlights).toHaveLength(1);
      expect(state.rangeHighlights[0]).toEqual({
        startPortion: 0.2,
        endPortion: 0.8
      });
    });

    it('should throw when highlighting duplicate range', () => {
      state.highlightRange(0.2, 0.8);
      expect(() => {
        state.highlightRange(0.2, 0.8);
      }).toThrow(/already highlighted/);
    });

    it('should unhighlight a range', () => {
      state.highlightRange(0.2, 0.8);
      state.unhighlightRange(0.2, 0.8);
      expect(state.rangeHighlights).toHaveLength(0);
    });

    it('should throw when unhighlighting non-existent range', () => {
      expect(() => {
        state.unhighlightRange(0.2, 0.8);
      }).toThrow(/not highlighted/);
    });
  });

  describe('Announcements', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should announce a string message', () => {
      state.announce('Test message');
      expect(state.announcement.text).toBe('Test message');
      expect(state.announcement.html).toBe('Test message');
    });

    it('should announce array of strings with line breaks', () => {
      state.announce(['Line 1', 'Line 2', 'Line 3']);
      expect(state.announcement.text).toContain('Line 1');
      expect(state.announcement.text).toContain('Line 2');
      expect(state.announcement.text).toContain('\r\n');
    });

    it('should announce HighlightedSummary', () => {
      const summary = {
        text: 'Summary text',
        html: '<span>Summary</span>',
        highlights: [{ start: 0, end: 7 }]
      };
      state.announce(summary);
      expect(state.announcement.text).toBe('Summary text');
      expect(state.announcement.html).toBe('<span>Summary</span>');
      expect(state.announcement.highlights).toHaveLength(1);
    });

    it('should set clear flag', () => {
      state.announce('Message', true);
      expect(state.announcement.clear).toBe(true);
    });

    it('should set startFrom position', () => {
      state.announce('Message', false, 10);
      expect(state.announcement.startFrom).toBe(10);
    });

    it('should not update announcement when disabled', () => {
      state.updateSettings(draft => {
        draft.ui!.isAnnouncementEnabled = false;
      });
      
      state.announce('Test');
      // When announcements are disabled, the text should not be updated
      expect(state.announcement.text).toBe('');
    });
  });

  describe('Popups', () => {
    let state: ParaState;

    beforeEach(() => {
      state = new ParaState({});
    });

    it('should remove popup by id', () => {
      state.popups = [
        { id: 'popup1', text: 'Test 1' } as any,
        { id: 'popup2', text: 'Test 2' } as any
      ];
      
      state.removePopup('popup1');
      expect(state.popups).toHaveLength(1);
      expect(state.popups[0].id).toBe('popup2');
    });

    it('should clear all popups', () => {
      state.popups = [
        { id: 'popup1', text: 'Test 1' } as any,
        { id: 'popup2', text: 'Test 2' } as any
      ];
      
      state.clearPopups();
      expect(state.popups).toHaveLength(0);
    });
  });

});
