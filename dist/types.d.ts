import { TimeSerie, Options } from '@chartwerk/base';
declare type LineTimeSerieParams = {
    confidence: number;
    mode: Mode;
};
export declare enum Mode {
    STANDARD = "Standard",
    CHARGE = "Charge"
}
export declare type LineTimeSerie = TimeSerie & Partial<LineTimeSerieParams>;
export declare type LineOptions = Options;
export {};
