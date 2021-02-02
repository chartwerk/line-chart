import { TimeSerie, Options } from '@chartwerk/core';

type LineTimeSerieParams = {
  confidence: number,
  mode: Mode
}
export enum Mode {
  STANDARD = 'Standard',
  CHARGE = 'Charge'
}
export type LineTimeSerie = TimeSerie & Partial<LineTimeSerieParams>;
export type LineOptions = Options;
