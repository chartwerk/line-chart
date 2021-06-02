import { TimeSerie, Options } from '@chartwerk/core';
declare type LineTimeSerieParams = {
    confidence: number;
    mode: Mode;
    maxLength: number;
    renderDots: boolean;
    useOutOfRange: boolean;
};
export declare enum Mode {
    STANDARD = "Standard",
    CHARGE = "Charge"
}
export declare type LineTimeSerie = TimeSerie & Partial<LineTimeSerieParams>;
export declare type LineOptions = Options;
export {};
