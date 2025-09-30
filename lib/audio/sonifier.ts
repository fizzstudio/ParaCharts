/*
Derived from Chart2Music

Code URL: https://github.com/julianna-langston/chart2music

MIT License

Copyright (c) 2022 julianna-langston

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { OscillatorAudioEngine, type AudioEngine } from '.';
import { AudioNotificationType } from './AudioEngine';
import { type Axis } from '../view/axis';
import { type DataLayer } from '../view/layers';
import { type ParaStore } from '../store';
import { PlaneDatapoint } from '@fizz/paramodel';
import { BaseChartInfo } from '../chart_types';
import { AxisLabelInfo } from '../common/axisinfo';

export const HERTZ = [
  16.3516, 17.32391, 18.35405, 19.44544, 20.60172, 21.82676, 23.12465, 24.49971, 25.95654, 27.5, 29.13524, 30.86771, // octave 0
  32.7032, 34.64783, 36.7081, 38.89087, 41.20344, 43.65353, 46.2493, 48.99943, 51.91309, 55, 58.27047, 61.73541, // octave 1
  65.40639, 69.29566, 73.41619, 77.78175, 82.40689, 87.30706, 92.49861, 97.99886, 103.8262, 110, 116.5409, 123.4708, // octave 2
  130.8128, 138.5913, 146.8324, 155.5635, 164.8138, 174.6141, 184.9972, 195.9977, 207.6523, 220, 233.0819, 246.9417, // octave 3
  261.6256, 277.1826, 293.6648, 311.127, 329.6276, 349.2282, 369.9944, 391.9954, 415.3047, 440, 466.1638, 493.8833, // octave 4
  523.2511, 554.3653, 587.3295, 622.254, 659.2551, 698.4565, 739.9888, 783.9909, 830.6094, 880, 932.3275, 987.7666, // octave 5
  1046.502, 1108.731, 1174.659, 1244.508, 1318.51, 1396.913, 1479.978, 1567.982, 1661.219, 1760, 1864.655, 1975.533, // octave 6
  2093.005, 2217.461, 2349.318, 2489.016, 2637.02, 2793.826, 2959.955, 3135.963, 3322.438, 3520, 3729.31, 3951.066, // octave 7
  4186.009, 4434.922, 4698.636, 4978.032, 5274.041, 5587.652, 5919.911, 6271.927, 6644.875, 7040, 7458.62, 7902.133, // octave 8
];

export const NOTE_LENGTH = 0.25;

// const hertzClamps = {
//   upper: HERTZ.length - 12,
//   lower: 21
// };

export const isUnplayable = (value: number, yMin: number, yMax: number) => {
  return isNaN(value) || value < yMin! || value > yMax!;
};

export const calcPan = (pct: number) => (isNaN(pct) ? 0 : (pct * 2 - 1) * 0.98);

export const interpolateBin = ({
  point,
  min,
  max,
  bins,
  scale
}: {
  point: number;
  min: number;
  max: number;
  bins: number;
  scale: 'linear'; //AxisScale;
}) => {
  return scale === 'linear'
    ? interpolateBinLinear({ point, min, max, bins })
    : interpolateBinLog({
      pointRaw: point,
      minRaw: min,
      maxRaw: max,
      bins
    });
};

const interpolateBinLinear = ({
  point,
  min,
  max,
  bins
}: {
  point: number;
  min: number;
  max: number;
  bins: number;
}) => {
  const pct = (point - min) / (max - min);
  return Math.floor(bins * pct);
};

const interpolateBinLog = ({
  pointRaw,
  minRaw,
  maxRaw,
  bins
}: {
  pointRaw: number;
  minRaw: number;
  maxRaw: number;
  bins: number;
}) => {
  const point = Math.log10(pointRaw);
  const min = Math.log10(minRaw);
  const max = Math.log10(maxRaw);
  const pct = (point - min) / (max - min);
  return Math.floor(bins * pct);
};

export class Sonifier {

  private context: null | AudioContext = null;
  private _audioEngine: AudioEngine | null = null;
  private _providedAudioEngine?: AudioEngine;

  //private _playListContinuous: NodeJS.Timeout[] = [];

  constructor(protected _chartInfo: BaseChartInfo, protected _store: ParaStore) {}

  /**
   * Confirm the audio engine was initialized
   */
  private _checkAudioEngine() {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (!this._audioEngine && this.context) {
      /* istanbul ignore next */
      this._audioEngine =
        this._providedAudioEngine ?? new OscillatorAudioEngine(this.context);
    }
  }

  /**
   * Get the available hertzes
   * @returns number[]
   */
  private _getHertzRange() {
    return HERTZ.slice(
      this._store.settings.sonification.hertzLower,
      this._store.settings.sonification.hertzUpper
    );
  }

  /**
   * Play a given data point
   * @param datapoint - the data point to play
   */
  playDatapoints(datapoints: PlaneDatapoint[], {
    cont = false,
    invert = false,
    durationVariable = false
  }: {
    cont?: boolean,
    invert?: boolean,
    durationVariable?: boolean
  } = {}) {
    this._checkAudioEngine();

    if (!this._audioEngine) {
      return;
    }

    const hertzes = this._getHertzRange();

    const xNominal = this._store.model!.getFacet('x')!.datatype === 'string';

    datapoints.forEach((datapoint, i) => {

      // Pastry chart datapoints currently fake being plane datapoints,
      // and so don't have indep and dep keys
      const x = datapoint.facetValueNumericized(datapoint.indepKey ?? 'x')!;
      let y = datapoint.facetValueNumericized(datapoint.depKey ?? 'y')!;
      // if (isUnplayable(x, this.chart.parent.docView.xAxis!)) {
      //   return;
      // }

      const xDiff = xNominal
        ? i
        : (x - this._chartInfo.axisInfo!.xLabelInfo.min!);
      const xRange = xNominal
        ? (datapoints.length - 1)
        : (this._chartInfo.axisInfo!.xLabelInfo.range!);
      const xPan =
        /*this._xAxis.type === 'log10'
          ? calcPan(
            (Math.log10(current.x) -
              Math.log10(this._xAxis.minimum)) /
            (Math.log10(this._xAxis.maximum) -
              Math.log10(this._xAxis.minimum))
          )
          :*/ calcPan(
            xDiff / xRange
          );

      /*if (current.type === 'annotation') {
        this._audioEngine.playNotification(
          AudioNotificationType.Annotation,
          xPan
        );
        return;
      }*/

      let yMin: number, yMax: number;
      if (this._chartInfo.axisInfo) {
        yMin = this._chartInfo.axisInfo.yLabelInfo.min!;
        yMax = this._chartInfo.axisInfo.yLabelInfo.max!;
      } else {
        const yInt = this._store.model!.getFacetInterval('y')!;
        yMin = yInt.start;
        yMax = yInt.end;
      }
      const origY = y;
      if (invert) {
        y = yMax - (y - yMin);
      }
      if (isUnplayable(y, yMin, yMax)) return;
      if (cont) {
        let hertzMin = Math.min(...hertzes)
        const pct = (y - yMin) / (yMax - yMin);
        const hz = hertzMin * (1.05946 ** (pct * hertzes.length))
        let pan = calcPan((x - this._chartInfo.axisInfo!.xLabelInfo.min!)
          / this._chartInfo.axisInfo!.xLabelInfo.range!)
        this._audioEngine!.playDataPoint(hz, pan, NOTE_LENGTH);
      }
      else {
        const yBin = interpolateBin({
          point: y,
          min: yMin,
          max: yMax,
          bins: hertzes.length - 1,
          scale: 'linear'
        });
        const duration = durationVariable
          ? (0.1 + (origY - yMin)/(yMax - yMin))
          : NOTE_LENGTH;
        this._audioEngine!.playDataPoint(hertzes[yBin], xPan, duration);
      }
    });
  }

  /**
   * Play an audio notification
   * @param earcon - the type of notification to play
   */
  playNotification(earcon?: string) {
    if (this._store.settings.sonification.isNotificationEnabled  ) {
      this._checkAudioEngine();

      /* istanbul ignore next */
      if (!this._audioEngine) {
        return;
      }

      let notificationType = AudioNotificationType.Annotation;
      let duration = 0.5;
      switch (earcon) {
        case 'annotation':
          notificationType = AudioNotificationType.Annotation;
          break;

        case 'bumper':
          notificationType = AudioNotificationType.Bumper;
          duration = 0.25;
          break;

        case 'high':
          notificationType = AudioNotificationType.High;
          break;

        case 'low':
          notificationType = AudioNotificationType.Low;
          break;

        case 'series':
          notificationType = AudioNotificationType.Series;
          duration = 0.3;
          break;

        case 'intersection':
          notificationType = AudioNotificationType.Intersection;
          break;

        case 'threshold':
          notificationType = AudioNotificationType.Threshold;
          break;

        default:
          break;
      }

      this._audioEngine.playNotification!(notificationType, 0, duration);
    }
  }
}