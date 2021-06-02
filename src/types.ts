import { TimeSerie, Options } from '@chartwerk/core';

type LineTimeSerieParams = {
  confidence: number,
  mode: Mode,
  maxLength: number,
  renderDots: boolean,
  useOutOfRange: boolean, // It's temporary hack. Need to refactor getValueInterval() method
}
export enum Mode {
  STANDARD = 'Standard',
  CHARGE = 'Charge'
}
export type LineTimeSerie = TimeSerie & Partial<LineTimeSerieParams>;
export type LineOptions = Options;
