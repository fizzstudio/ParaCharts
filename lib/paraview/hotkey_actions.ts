
import { type ParaView } from './paraview';

export interface AvailableActions {
  moveRight(): Promise<void>;
  moveLeft(): Promise<void>;
  moveUp(): Promise<void>;
  moveDown(): Promise<void>;
  goMinimum(): Promise<void>;
  goMaximum(): Promise<void>;
  goTotalMinimum(): Promise<void>;
  goTotalMaximum(): Promise<void>;
  select(): void;
  selectExtend(): void;
  selectClear(): void;
  playRight(): Promise<void>;
  playLeft(): Promise<void>;
  stopPlay(): void;
  queryData(): void;
  sonificationModeToggle(): void;
  announcementModeToggle(): void;
  voicingModeToggle(): void;
  darkModeToggle(): void;
  lowVisionModeToggle(): void;
  openHelp(): void;
  announceVersionInfo(): void;
  chordModeToggle(): void;
  shutUp(): void;
  repeatLastAnnouncement(): void;
  addAnnotation(): void;
}


export class HotkeyActions {

  public readonly actions: { [Property in keyof AvailableActions]: (() => void | Promise<void>) };

  constructor(paraView: ParaView) {
    const store = paraView.store;
    // Always return the current data layer (i.e., don't let the
    // actions close over a value that might be removed)
    const chart = () => paraView.documentView!.chartLayers.dataLayer;
    this.actions = {
      async moveRight() {
        chart().clearPlay();
        await chart().moveRight();
      },
      async moveLeft() {
        chart().clearPlay();
        await chart().moveLeft();
      },
      async moveUp() {
        chart().clearPlay();
        await chart().moveUp();
      },
      async moveDown() {
        chart().clearPlay();
        await chart().moveDown();
      },
      async goMinimum() {
        await chart().goSeriesMinMax(true);
      },
      async goMaximum() {
        await chart().goSeriesMinMax(false);
      },
      async goTotalMinimum() {
        await chart().goChartMinMax(true);
      },
      async goTotalMaximum() {
        await chart().goChartMinMax(false);
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
      async playRight() {
        chart().clearPlay();
        await chart().playRight();
      },
      async playLeft() {
        chart().clearPlay();
        await chart().playLeft();
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
          store.announce('Self-voicing disabled');
          store.updateSettings(draft => {
            draft.ui.isVoicingEnabled = false;
          });
        } else {
          store.updateSettings(draft => {
            draft.ui.isVoicingEnabled = true;
          });
          store.announce('Self-voicing enabled');
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
      chordModeToggle() {
        store.updateSettings(draft => {
          draft.sonification.isChordModeEnabled = !draft.sonification.isChordModeEnabled;
        });
        if (store.settings.sonification.isChordModeEnabled) {
          store.prependAnnouncement('Chord mode enabled');
        } else {
          store.prependAnnouncement('Chord mode disabled');
        }      
      },
      shutUp() {
        paraView.paraChart.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        paraView.paraChart.ariaLiveRegion.replay();
      },
      addAnnotation() {
        store.addAnnotation();
      }
    };
  }

}