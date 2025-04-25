/* eslint-disable no-unused-vars */
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

/**
 * The types of notifications that an engine can support.
 * These represent other information than data points, such as annotations, footnotes, etc.
 */
export enum AudioNotificationType {
  /** An annotation associated with a single data point */
  Annotation = 'annotation',
  Bumper = 'bumper',
  Threshold = 'threshold',
  Intersection = 'intersection',
  High = 'high',
  Low = 'low',
  Series = 'series',
}

/**
 * An interface which all audio engines must implement.
 */
export interface AudioEngine {
  /**
   * The master gain for the audio engine.
   * Setting this to 0 will mute the engine, while setting it to 1 will enable full volume.
   */
  masterGain: number;

  /**
   * Play a sound to represent a data point.
   * @param frequency - the fundimental frequency
   * @param panning - where to play the sound (-1 <= 0 <= 1, 0 == center)
   * @param duration - the duration of the note in seconds
   */
  playDataPoint(frequency: number, panning: number, duration: number): void;

  /**
   * Play a notification sound.
   * Not all engines may implement this method, so you should always check before calling it.
   * @param notificationType - The type of notification to play
   * @param [panning] - where to play the sound (-1 <= 0 <= 1, 0 == center)
   * @param [duration] - the duration of the notification in seconds
   */
  playNotification?(
    notificationType: AudioNotificationType,
    panning?: number,
    duration?: number
  ): void;
}
