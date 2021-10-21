import { ChartwerkPod, TickOrientation, TimeFormat } from '@chartwerk/core';
import { LineTimeSerie, LineOptions, Mode } from './types';
export declare class ChartwerkLineChart extends ChartwerkPod<LineTimeSerie, LineOptions> {
    lineGenerator: any;
    metricContainer: any;
    constructor(_el: HTMLElement, _series?: LineTimeSerie[], _options?: LineOptions);
    renderMetrics(): void;
    initLineGenerator(): void;
    appendData(data: [number, number][]): void;
    _renderDots(datapoints: number[][], serieIdx: number): void;
    _renderLines(datapoints: number[][], serieIdx: number): void;
    _renderMetric(datapoints: number[][], metricOptions: {
        color: string;
        confidence: number;
        target: string;
        mode: Mode;
        serieIdx: number;
        renderDots: boolean;
        renderLines: boolean;
    }): void;
    updateCrosshair(): void;
    appendCrosshairCircles(): void;
    appendCrosshairCircle(serieIdx: number): void;
    renderSharedCrosshair(values: {
        x?: number;
        y?: number;
    }): void;
    hideSharedCrosshair(): void;
    moveCrosshairLine(xPosition: number, yPosition: number): void;
    moveCrosshairCircle(xPosition: number, yPosition: number, serieIdx: number): void;
    hideCrosshairCircle(serieIdx: number): void;
    getClosestDatapoint(serie: LineTimeSerie, xValue: number, yValue: number): [number, number];
    getClosestIndex(datapoints: [number, number][], xValue: number, yValue: number): number;
    getValueInterval(columnIdx: number): number | undefined;
    onMouseMove(): void;
    findAndHighlightDatapoints(xValue: number, yValue: number): {
        value: [number, number];
        color: string;
        label: string;
    }[];
    isOutOfRange(closestDatapoint: [number, number], xValue: number, yValue: number, useOutOfRange?: boolean): boolean;
    onMouseOver(): void;
    onMouseOut(): void;
}
export declare const VueChartwerkLineChartObject: {
    render(createElement: any): any;
    mixins: {
        props: {
            id: {
                type: StringConstructor;
                required: boolean;
            };
            series: {
                type: ArrayConstructor;
                required: boolean;
                default: () => any[];
            };
            options: {
                type: ObjectConstructor;
                required: boolean;
                default: () => {};
            };
        };
        watch: {
            id(): void;
            series(): void;
            options(): void;
        };
        mounted(): void;
        destroyed(): void;
        methods: {
            render(): void;
            renderSharedCrosshair(values: {
                x?: number;
                y?: number;
            }): void;
            hideSharedCrosshair(): void;
            onPanningRescale(event: any): void;
            renderChart(): void;
            appendEvents(): void;
            zoomIn(range: any): void;
            zoomOut(centers: any): void;
            mouseMove(evt: any): void;
            mouseOut(): void;
            onLegendClick(idx: any): void;
            panningEnd(range: any): void;
            panning(range: any): void;
            contextMenu(evt: any): void;
            sharedCrosshairMove(event: any): void;
            renderEnd(): void;
        };
    }[];
    methods: {
        render(): void;
        renderSharedCrosshair(values: any): void;
        hideSharedCrosshair(): void;
    };
};
export { LineTimeSerie, LineOptions, Mode, TickOrientation, TimeFormat };
