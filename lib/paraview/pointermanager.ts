import { Logger, getLogger } from '@fizz/logger';
import { Popup } from '../view/popup';

import { type ParaView } from './paraview';

interface BasePointerDetails {
  target: Element;
  position?: number[];
}

interface PointerDetails {
  id: number;
  target: Element;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  value?: {
    x: any;
    y: any;
  };
}

interface Point {
  x: number;
  y: number;
}

/**
 * Pointer event manager enables:
 * - registering/unregistering custom pointer events
 * - generating documentations listing pointer events
 * @internal
 */
export class PointerEventManager {
  protected log: Logger = getLogger("PointerEventManager");
  private _dataRoot: SVGElement | null; // the group that contains all the datapoints

  private _touchArray: Array<PointerDetails> = [];
  private _currentTarget: SVGElement | null = null;

  private _coords: Point | null = null;

  constructor(protected _paraView: ParaView) {
    this._dataRoot = null;
  }

  get coords() {
    return this._coords
  }
  /**
   * Records pointer event info.
   * @param event - The event on the element.
   */
  protected _registerPointerEvent(event: PointerEvent): PointerDetails {
    return {
      id: event.pointerId,
      target: event.target as SVGGraphicsElement,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.offsetX,
      offsetY: event.offsetY
    };
  }

  /**
   * Starts pointer events.
   * @param event - The event on the element.
   */
  handleStart(event: PointerEvent) {
    // Note: `handleStart` is not currently used, but will be when we add marquee dragging
    const touch = this._registerPointerEvent(event);
    // Note: `this._touchArray` is not currently used, but will be when we add drawing
    this._touchArray.push(touch);
  }

  /**
   * Ends pointer events.
   * @param event - The event on the element.
   */
  handleEnd(event: PointerEvent) {
    // Note: `handleEnd` is not currently used, but will be when we add marquee dragging
    this.handleCancel(event);
  }

  /**
   * Cancels pointer events.
   * @param event - The event on the element.
   */
  handleCancel(event: PointerEvent) {
    // Note: `handleCancel` is not currently used, but will be when we add marquee dragging
    const id = event.pointerId;
    const index = this._touchArray.findIndex((item) => item.id === id);
    if (index >= 0) {
      this._touchArray.splice(index, 1);
    } else {
    }
  }

  /**
   * Reads element labels and default settings, and triggers speech.
   * @param event - The event on the element.
   */
  handleMove(event: PointerEvent) {
    if (!this._paraView?.documentView?.chartLayers){
      return;
    }
    const target = event.target as SVGGraphicsElement;
    // To avoid "implicit pointer capture", where the event listener element prevents the event target
    // from changing to a another element, even a child element, se must explicitly release the pointer
    //  after every `pointermove` event handling
    target.releasePointerCapture(event.pointerId);

    this._coords = this._localCoords(event);
    if (this._paraView.documentView) {
      this._paraView.paraState.pointerCoords.x = this._coords.x - this._paraView.documentView!.padding.left - this._paraView.documentView!.chartLayers.x
      this._paraView.paraState.pointerCoords.y = this._coords.y - this._paraView.documentView!.padding.top - this._paraView.documentView!.chartLayers.y
      this._paraView.documentView?.pointerMove();
    }
    if (target === this._paraView.root || target === this._dataRoot) {
      this._currentTarget = null;
    } else if (target === this._currentTarget) {
    } else if (target !== this._currentTarget) {
      this._currentTarget = target;

      // Note: the following block is not currently used, but may be in future features
      // track and update touches
      const id = event.pointerId;
      const index = this._touchArray.findIndex((item) => item.id === id);
      if (index >= 0) {
        const priorTouch = this._touchArray[index];
        const touch = this._registerPointerEvent(event);
        this._touchArray[index] = touch;
      }
    }
  }

  /**
   * .
   * @param event - The event on the element.
   */
  protected _updateTouchArray(event: PointerEvent) {
    // Note: the following block is not currently used, but will be when we add drawing
    // track and update touches
    const id = event.pointerId
    const index = this._touchArray.findIndex((item) => item.id === id);

    if (index >= 0) {
      const priorTouch = this._touchArray[index];
      const touch = this._registerPointerEvent(event);

      this._touchArray[index] = touch;

      this._coords = this._localCoords(event);
    }
  }

  /**
   * Reads element labels and default settings, and triggers speech.
   * @param event - The event on the element.
   */
  handleClick(event: PointerEvent | MouseEvent) {
    const target = event.target as SVGGraphicsElement;
    if (event.detail < 2) {
      // not a double click, so do normal behavior
      if (target === this._paraView.frame) {
        this.log.info('clicked backdrop!')
        this._paraView.paraState.chartInfo.didClickBackground();
      } else {
        this._selectElement(target, event.shiftKey);
      }
    }
  }

  /**
   * Double click handler.
   * @param event - The event on the element.
   */
  handleDoubleClick(event: PointerEvent | MouseEvent) {
    const target = event.target as SVGGraphicsElement;
    event.preventDefault();
    if (target === this._paraView.root || target === this._dataRoot) {
      // this._selectElement(target);
      return;
    } else {
      // this._outputUtterance(utteranceArray);
    }
  }

  /**
   * Set selected element and add a highlight box.
   * @param target - The element to be selected; deselects if absent or `null`.
   */
  protected async _selectElement(target: SVGGraphicsElement, isAdd?: boolean) {
    if (this._paraView.paraState.config.ui.isTourGuideEnabled) return;
    if (target) {
      const datapointEl = target.closest('[role="datapoint"]') as SVGElement;
      if (datapointEl) {
        const id = (datapointEl.id.endsWith('-sym')
          || datapointEl.id.endsWith('-ilb'))  // slice inside label
          ? datapointEl.id.slice(0, -4)
          : datapointEl.id;
        const datapointView = this._paraView.documentView!.chartLayers.dataLayer.datapointViewForId(id)!;
        const chartInfo = this._paraView.paraState.chartInfo;
        // Set quiet = true so that the visit announcement doesn't overwrite
        // the selection announcement
        chartInfo.navMap!.goTo(chartInfo.navDatapointType, {
          seriesKey: datapointView.seriesKey,
          index: datapointView.index
        }, true);
        this._paraView.paraState.chartInfo.selectCurrent(!!isAdd);
      } else {
        // might have clicked on an axis label, axis tick label or something else we can act on,
        //  but it's not a data point, so it can't be "selected"
        this.log.info('not a datapoint!');
        this._paraView.paraState.chartInfo.didClickBackground();
      }
    }
  }

  /**
 * Adjust the coordinates for transforms
 * @param event - The mouse event with the coordinates
 * @returns A coordinate point object with the proper transforms, as a 2-precision float
 */
  protected _localCoords(event: PointerEvent): Point {
    let point = {
      x: 0,
      y: 0,
    };

    if (event.isTrusted) {
      let p = this._paraView.root!.createSVGPoint();
      p.x = event.clientX;
      p.y = event.clientY;
      p = p.matrixTransform(this._paraView.frame?.getScreenCTM()?.inverse());

      // NOTE: limiting the floats to precison 2 makes code more readable and reduces file size,
      //   with no loss of rendering since SVG only works at one pixel of accuracy anyway
      point = {
        x: +p.x.toFixed(2),
        y: +p.y.toFixed(2),
      };
    } else {
      // Custom event, just in case
      // point = {
      //   x: event.detail.clientX,
      //   y: event.detail.clientY,
      // };
    }

    return point;
  }
}
