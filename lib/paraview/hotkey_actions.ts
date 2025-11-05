
import { type ParaView } from './paraview';

export interface AvailableActions {
  moveRight(): Promise<void>;
  moveLeft(): Promise<void>;
  moveUp(): Promise<void>;
  moveDown(): Promise<void>;
  moveIn(): Promise<void>;
  moveOut(): Promise<void>;
  goFirst(): void;
  goLast(): void;
  goMinimum(): void;
  goMaximum(): void;
  goTotalMinimum(): void;
  goTotalMaximum(): void;
  select(): void;
  extendSelection(): void;
  clearSelection(): void;
  playRight(): void;
  playLeft(): void;
  stopPlay(): void;
  queryData(): void;
  toggleSonificationMode(): void;
  toggleAnnouncementMode(): void;
  toggleVoicingMode(): void;
  toggleDarkMode(): void;
  toggleLowVisionMode(): void;
  openHelp(): void;
  announceVersionInfo(): void;
  jumpToChordLanding(): void;
  shutUp(): void;
  repeatLastAnnouncement(): void;
  addAnnotation(): void;
  toggleNarrativeHighlightMode(): void;
  playPauseMedia(): void;
  reset(): void;
}

type ActionMap = { [Property in keyof AvailableActions]: (() => void | Promise<void>) };

export abstract class HotkeyActions {
  protected _actions!: Partial<ActionMap>;

  get actions() {
    return this._actions;
  }
}

export class NormalHotkeyActions extends HotkeyActions {
  constructor(paraView: ParaView) {
    super();
    this._actions = {
      async moveRight() {
        paraView.paraChart.performer.move('right');
      },
      async moveLeft() {
        paraView.paraChart.performer.move('left');
      },
      async moveUp() {
        paraView.paraChart.performer.move('up');
      },
      async moveDown() {
        paraView.paraChart.performer.move('down');
      },
      async moveIn() {
        paraView.paraChart.performer.move('in');
      },
      async moveOut() {
        paraView.paraChart.performer.move('out');
      },
      goFirst() {
        paraView.paraChart.performer.goFirst();
      },
      goLast() {
        paraView.paraChart.performer.goLast();
      },
      goMinimum() {
        paraView.paraChart.performer.goMinimum();
      },
      goMaximum() {
        paraView.paraChart.performer.goMaximum();
      },
      goTotalMinimum() {
        paraView.paraChart.performer.goTotalMinimum();
      },
      goTotalMaximum() {
        paraView.paraChart.performer.goTotalMaximum();
      },
      select() {
        paraView.paraChart.performer.select();
      },
      extendSelection() {
        paraView.paraChart.performer.extendSelection();
      },
      clearSelection() {
        paraView.paraChart.performer.clearSelection();
      },
      playRight() {
        paraView.paraChart.performer.playRight();
      },
      playLeft() {
        paraView.paraChart.performer.playLeft();
      },
      stopPlay() {
        paraView.paraChart.performer.stopPlay();
      },
      queryData() {
        paraView.paraChart.performer.queryData();
      },
      toggleSonificationMode() {
        paraView.paraChart.performer.toggleSonificationMode();
      },
      toggleAnnouncementMode() {
        paraView.paraChart.performer.toggleAnnouncementMode();
      },
      toggleVoicingMode() {
        paraView.paraChart.performer.toggleVoicingMode();
      },
      toggleDarkMode() {
        paraView.paraChart.performer.toggleDarkMode();
      },
      toggleLowVisionMode() {
        paraView.paraChart.performer.toggleLowVisionMode();
      },
      openHelp() {
        paraView.paraChart.performer.openHelp();
      },
      announceVersionInfo() {
        paraView.paraChart.performer.announceVersionInfo();
      },
      jumpToChordLanding() {
        paraView.paraChart.performer.jumpToChordLanding();
      },
      shutUp() {
        paraView.paraChart.performer.shutUp();
      },
      repeatLastAnnouncement() {
        paraView.paraChart.performer.repeatLastAnnouncement();
      },
      addAnnotation() {
        paraView.paraChart.performer.addAnnotation();
      },
      toggleNarrativeHighlightMode() {
        paraView.paraChart.performer.toggleNarrativeHighlightMode();
      },
      playPauseMedia() {
        paraView.paraChart.performer.playPauseMedia();
      },
      reset() {
        paraView.paraChart.performer.reset();
      }
    };
  }

}

export class NarrativeHighlightHotkeyActions extends HotkeyActions {
  constructor(paraView: ParaView) {
    super();
    const store = paraView.store;
    const chart = () => paraView.documentView!.chartInfo;
    let prevIdx = 0;
    const voicing = paraView.paraChart.ariaLiveRegion.voicing;
    const getMsg = (idx: number) => {
        const div = document.createElement('div');
        div.innerHTML = store.announcement.html;
        return (div.children[idx] as HTMLElement).innerText;
    };
    const highlightSpan = (idxDelta: number) => {
      const spans = store.paraChart.captionBox.getSpans();
      let idx = prevIdx;
      store.clearHighlight();
      store.clearAllSeriesLowlights();
      spans.forEach(span => {
        span.classList.remove('highlight');
      });
      if (!voicing.manualOverride) {
        idx = voicing.highlightIndex!;
        voicing.manualOverride = true;
      }
      idx = Math.min(store.announcement.highlights.length - 1, Math.max(0, idx + idxDelta));

      prevIdx = idx;
      const msg = getMsg(idx);
      const highlight = store.announcement.highlights[idx];
      const prevHighlight = store.announcement.highlights[Math.max(0, idx - 1)];
      let prevNavcode = prevHighlight.navcode ?? '';
      const span = spans[idx];

      span.classList.add('highlight');
      voicing.shutUp();
      voicing.speakText(msg);
      prevNavcode = voicing.doHighlight(highlight, prevNavcode);
      if (prevNavcode) {
        chart().didRemoveHighlight(prevNavcode);
        prevNavcode = '';
      }
    };
    this._actions = {
      async moveRight() {
        highlightSpan(1);
      },
      async moveLeft() {
        highlightSpan(-1);
      },
      async moveUp() {
        highlightSpan(-1);
      },
      async moveDown() {
        highlightSpan(1);
      },
      goFirst() {
      },
      goLast() {
      },
      toggleVoicingMode() {
        if (store.settings.ui.isVoicingEnabled) {
          store.updateSettings(draft => {
            draft.ui.isVoicingEnabled = false;
          });
        } else {
          store.updateSettings(draft => {
            draft.ui.isVoicingEnabled = true;
          });
        }
      },
      toggleDarkMode() {
        paraView.paraChart.performer.toggleDarkMode();
      },
      toggleLowVisionMode() {
        paraView.paraChart.performer.toggleLowVisionMode();
      },
      openHelp() {
        paraView.paraChart.performer.openHelp();
      },
      shutUp() {
        paraView.paraChart.performer.shutUp();
      },
      repeatLastAnnouncement() {
      },
      toggleNarrativeHighlightMode() {
        if (voicing.manualOverride) {
          voicing.manualOverride = false;
          (async () => {
            store.announce(await chart().summarizer.getChartSummary());
          })();
        } else {
          paraView.endNarrativeHighlightMode();
      		if (store.settings.ui.isNarrativeHighlightEnabled) {
            store.updateSettings(draft => {
              draft.ui.isNarrativeHighlightEnabled = false;
            });
          } else {
            store.updateSettings(draft => {
              draft.ui.isNarrativeHighlightEnabled = true;
            });
          }
        }
      },
      playPauseMedia() {
        voicing.togglePaused();
      }
    };
  }

}