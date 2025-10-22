
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
  selectExtend(): void;
  selectClear(): void;
  playRight(): void;
  playLeft(): void;
  stopPlay(): void;
  queryData(): void;
  sonificationModeToggle(): void;
  announcementModeToggle(): void;
  voicingModeToggle(): void;
  darkModeToggle(): void;
  lowVisionModeToggle(): void;
  openHelp(): void;
  announceVersionInfo(): void;
  jumpToChordLanding(): void;
  shutUp(): void;
  repeatLastAnnouncement(): void;
  addAnnotation(): void;
  narrativeHighlightModeToggle(): void;
  mediaPlayPause(): void;
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
    const store = paraView.store;
    // Always return the current chart info object (i.e., don't let the
    // actions close over a value that might be removed)
    const chart = () => paraView.documentView!.chartInfo;
    this._actions = {
      async moveRight() {
        chart().clearPlay();
        chart().move('right');
      },
      async moveLeft() {
        chart().clearPlay();
        chart().move('left');
      },
      async moveUp() {
        chart().clearPlay();
        chart().move('up');
      },
      async moveDown() {
        chart().clearPlay();
        chart().move('down');
      },
      async moveIn() {
        chart().clearPlay();
        chart().move('in');
      },
      async moveOut() {
        chart().clearPlay();
        chart().move('out');
      },
      goFirst() {
        chart().navFirst();
      },
      goLast() {
        chart().navLast();
      },
      goMinimum() {
        chart().goSeriesMinMax(true);
      },
      goMaximum() {
        chart().goSeriesMinMax(false);
      },
      goTotalMinimum() {
        chart().goChartMinMax(true);
      },
      goTotalMaximum() {
        chart().goChartMinMax(false);
      },
      select() {
        chart().selectCurrent(false);
      },
      selectExtend() {
        chart().selectCurrent(true);
      },
      selectClear() {
        chart().clearDatapointSelection();
      },
      playRight() {
        chart().clearPlay();
        chart().playDir('right');
      },
      playLeft() {
        chart().clearPlay();
        chart().playDir('left');
      },
      stopPlay() {
        chart().clearPlay();
      },
      queryData() {
        chart().queryData();
      },
      sonificationModeToggle() {
        store.updateSettings(draft => {
          draft.sonification.isSoniEnabled = !draft.sonification.isSoniEnabled;
          store.announce(
            `Sonification ${draft.sonification.isSoniEnabled ? 'enabled' : 'disabled'}`);
        });
      },
      announcementModeToggle() {
        if (store.settings.ui.isAnnouncementEnabled) {
          store.announce('Announcements disabled');
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = false;
          });
        } else {
          store.updateSettings(draft => {
            draft.ui.isAnnouncementEnabled = true;
          });
          store.announce('Announcements enabled');
        }
      },
      voicingModeToggle() {
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
      darkModeToggle() {
        store.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          store.announce(
            `Dark mode ${draft.color.isDarkModeEnabled ? 'enabled' : 'disabled'}`);
        });
      },
      lowVisionModeToggle() {
        store.updateSettings(draft => {
          if (draft.ui.isLowVisionModeEnabled) {
            // Allow the exit from fullscreen to disable LV mode
            draft.ui.isFullscreenEnabled = false;
          } else {
            draft.ui.isLowVisionModeEnabled = true;
          }
        });
      },
      openHelp() {
        paraView.paraChart.controlPanel.showHelpDialog();
      },
      announceVersionInfo() {
        store.announce(`Version ${__APP_VERSION__}; commit ${__COMMIT_HASH__}`);
      },
      jumpToChordLanding() {
        chart().navToChordLanding();
      },
      shutUp() {
        paraView.paraChart.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        paraView.paraChart.ariaLiveRegion.replay();
      },
      addAnnotation() {
        store.addAnnotation();
      },
      narrativeHighlightModeToggle() {
        paraView.startNarrativeHighlightMode();
		    if (store.settings.ui.isNarrativeHighlightsEnabled) {
          store.updateSettings(draft => {
            draft.ui.isNarrativeHighlightEnabled = false;
          });
        } else {
          store.updateSettings(draft => {
            draft.ui.isNarrativeHighlightEnabled = true;
          });
        }
      },
      mediaPlayPause() {

      },
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
      store.soloSeries = '';
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
      voicingModeToggle() {
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
      darkModeToggle() {
        store.updateSettings(draft => {
          draft.color.isDarkModeEnabled = !draft.color.isDarkModeEnabled;
          store.announce(
            `Dark mode ${draft.color.isDarkModeEnabled ? 'enabled' : 'disabled'}`);
        });
      },
      lowVisionModeToggle() {
        store.updateSettings(draft => {
          draft.ui.isLowVisionModeEnabled = !draft.ui.isLowVisionModeEnabled;
        });
      },
      openHelp() {
        paraView.paraChart.controlPanel.showHelpDialog();
      },
      shutUp() {
        voicing.shutUp();
      },
      repeatLastAnnouncement() {
      },
      narrativeHighlightModeToggle() {
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
      mediaPlayPause() {
        voicing.togglePaused();
      }
    };
  }

}