import { TimeSerie, Options } from '@chartwerk/core';

type LineTimeSerieParams = {
  confidence: number,
  mode: Mode,
  maxLength: number,
  renderDots: boolean,
  renderLines: boolean, // TODO: refactor same as scatter-pod
  dashArray: string, // TODO: just for testing. Use enum
  useOutOfRange: boolean, // It's temporary hack. Need to refactor getValueInterval() method,
  class: string, // option to add custom class to each serie element
}
export enum Mode {
  STANDARD = 'Standard',
  CHARGE = 'Charge'
}
export type LineTimeSerie = TimeSerie & Partial<LineTimeSerieParams>;
export type LineOptions = Options;
