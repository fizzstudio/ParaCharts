
import { type ParaView } from './paraview';

export interface AvailableActions {
  moveRight(): void;
  moveLeft(): void;
  moveUp(): void;
  moveDown(): void;
  moveIn(): void;
  moveOut(): void;
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
}


export class HotkeyActions {

  public readonly actions: { [Property in keyof AvailableActions]: (() => void | Promise<void>) };

  constructor(paraView: ParaView) {
    const store = paraView.store;
    // Always return the current data layer (i.e., don't let the
    // actions close over a value that might be removed)
    const chart = () => paraView.documentView!.chartLayers.dataLayer;
    this.actions = {
      moveRight() {
        chart().clearPlay();
        chart().move('right');
      },
      moveLeft() {
        chart().clearPlay();
        chart().move('left');
      },
      moveUp() {
        chart().clearPlay();
        chart().move('up');
      },
      moveDown() {
        chart().clearPlay();
        chart().move('down');
      },
      moveIn() {
        chart().clearPlay();
        chart().move('in');
      },
      moveOut() {
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
      jumpToChordLanding() {
        chart().navToChordLanding();
      },
      shutUp() {
        // paraView.paraChart.controlPanel.descriptionPanel.ariaLiveRegion.voicing.shutUp();
        paraView.paraChart.ariaLiveRegion.voicing.shutUp();
      },
      repeatLastAnnouncement() {
        // paraView.paraChart.controlPanel.descriptionPanel.ariaLiveRegion.replay();
        paraView.paraChart.ariaLiveRegion.replay();
      },
    };
  }

}