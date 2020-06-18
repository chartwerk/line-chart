import { TimeSerie, Options } from '@chartwerk/base';

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
export type RenderMetricOption = {
  color: string,
  confidence: number,
  target: string,
  mode: Mode
}
