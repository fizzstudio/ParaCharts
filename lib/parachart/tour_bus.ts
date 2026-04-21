import { ParaCaptionBox } from '../control_panel/caption';
import { ParaState } from '../state';
import { Highlight } from '@fizz/parasummary';

interface CaptureRequest {
  target: string;
  entryId: string | null;
}

interface CaptureResponse {
  version: number;
  source: string;
  target: string;
  entryId: string | null;
  chains: string[];
}

interface PlayRequest {
  driver: string;
  entries: Entry[];
  html: string;
  mode: string;
  text: string;
  version: number;
}

interface ContextPayload {
  target: 'new';
  seriesKeys: string[];
  entries: ContextEntry[];
}

interface Entry {
  actions: string[];
  elementType: string;
  id: string;
  pauseStartMs: number;
  pauseEndMs: number;
  phraseText: string;
}

interface ContextEntry {
  chains: string[];
  elementType: string;
  id: string;
  phraseText: string;
}

const TB_READY = 'tourBus:ready';
const TB_CAPTURE_REQUEST = 'tourBus:captureRequest';
const TB_CAPTURE = 'tourBus:capture';
const TB_PLAY = 'tourBus:play';
const TB_STOP = 'tourBus:stop';

export class TourBus {
  constructor(protected _paraState: ParaState, protected _caption: ParaCaptionBox) {
    this.init();
  }

  init() {
    // Announce tourBus capabilities
    window.dispatchEvent(new CustomEvent(TB_READY, { detail: {
      version: 1,
      capture: ['chain', 'chains', 'entries'],
      playback: ['entries', 'html', 'text'],
      elementTypes: ['span', 'p', 'li'],
      source: 'ParaCharts'
    }}));

    // Listen for capture requests from the tool and respond with a payload
    window.addEventListener(TB_CAPTURE_REQUEST, (ev: CustomEvent) => {
      const req: CaptureRequest = ev.detail || {};
      const detail = this._getCaptureResponse(
        { target: req.target || 'active', entryId: req.entryId });
      window.dispatchEvent(new CustomEvent(TB_CAPTURE, { detail }));
    });

    // Listen for "play tour" requests from the tool
    window.addEventListener(TB_PLAY, async (ev: CustomEvent) => {
      const detail: PlayRequest = ev.detail || {};
      stopPlayback();

      // The spans come wrapped in an <article>
      const div = document.createElement('div');
      div.innerHTML = detail.html;

      const highlights: Highlight[] = [];
      let total = 0;
      for (const el of div.firstElementChild!.children) {
        const span = el as HTMLElement;
        highlights.push({
          phrasecode: span.dataset.phrasecode!,
          action: span.dataset.action,
          start: total,
          end: total + span.textContent.length,
        });
        total += span.textContent.length;
      }

      await this._paraState.setCaption({text: detail.text, html: div.firstElementChild!.innerHTML.trim(), highlights});
      this._paraState.startTourGuide();
    });

    window.addEventListener(TB_STOP, () => {
      stopPlayback();
      console.log('Stopped tour playback.');
    });

    const stopPlayback = () => {
      this._paraState.endTourGuide();
    };

  }

  protected _getCaptureResponse({ target, entryId = null }: CaptureRequest): CaptureResponse {
    return {
      version: 1,
      source: 'ParaCharts',
      target,
      entryId,
      chains: this._paraState.getActionChains(),
    };
  }

  protected async _getContextPayload(): Promise<ContextPayload> {
    const summary = await this._paraState.chartInfo.summarizer.getChartSummary();
    // const caption = this._caption.caption;
    const div = document.createElement('div');
    div.innerHTML = summary.html;
    const entries = (Array.from(div.children) as HTMLElement[]).map(el => {
      return {
        id: `phrase-${el.dataset.phrasecode}`,
        elementType: 'span',
        phraseText: el.textContent,
        chains: el.dataset.action?.split(' ') ?? []
      };
    });
    return {
      target: 'new',
      seriesKeys: this._paraState.model!.seriesKeys,
      entries,
    };
  }

  async sendContextPayload() {
    window.dispatchEvent(new CustomEvent(TB_CAPTURE, { detail: await this._getContextPayload() }));
  }
}