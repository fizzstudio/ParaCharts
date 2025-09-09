import { Test, TestRunner, ExpectFunction } from './TestRunner';
import { waitFor } from 'storybook/test';
import * as shadow from 'shadow-dom-testing-library';

export default class BarTestRunner extends TestRunner {

  constructor(canvas: any, userEvent: any, expect: ExpectFunction) {
    super(canvas, userEvent, expect);
  }

  @Test
  async keyboardFocus() {
    const parachart = await this.canvas.findByTestId('para-chart');
    const application = shadow.getByShadowRole(parachart, 'application');
    await application.focus();
    await this.userEvent.keyboard('{ArrowRight}');
    await this.userEvent.keyboard('{ArrowRight}');
    const ariaLive = shadow.getByShadowTestId(parachart, 'sr-status');
    const records = this.manifest.datasets[0]!.series[0]!.records!;
    for (const {x, y} of records) {
      let announcement: string | undefined = '';
      await this.waitFor(() => {
        announcement = ariaLive.querySelector('div')?.textContent;
        this.expect(announcement).toContain(`${x}, ${y}`);
      });
      await this.userEvent.keyboard('q');
      await this.waitFor(() => {
        const updatedAnnouncement = ariaLive.querySelector('div')?.textContent;
        this.expect(announcement).not.toBe(updatedAnnouncement);
      });
      await this.userEvent.keyboard('{ArrowRight}');
    }
  }

}
