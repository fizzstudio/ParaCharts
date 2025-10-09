
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
  narrativeHighlightModeStart(): void;
  narrativeHighlightModeEnd(): void;
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
          draft.ui.isLowVisionModeEnabled = !draft.ui.isLowVisionModeEnabled;
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
      narrativeHighlightModeStart() {
        paraView.startNarrativeHighlightMode();
      },
    };
  }

}

export class NarrativeHighlightHotkeyActions extends HotkeyActions {
  constructor(paraView: ParaView) {
    super();
    const store = paraView.store;
    const chart = () => paraView.documentView!.chartInfo;
    this._actions = {
      async moveRight() {
        // paraView.paraChart.ariaLiveRegion.voicing.shutUp();
        // store.announce(
        //   store.announcement, undefined,
        //   paraView.paraChart.ariaLiveRegion.voicing.highlightIndex + 1);
      },
      async moveLeft() {
      },
      async moveUp() {
      },
      async moveDown() {
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
        paraView.paraChart.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        paraView.paraChart.ariaLiveRegion.replay();
      },
      narrativeHighlightModeStart() {
        paraView.paraChart.ariaLiveRegion.voicing.togglePaused();
      },
      narrativeHighlightModeEnd() {
        paraView.endNarrativeHighlightMode();
      }
    };
  }

}