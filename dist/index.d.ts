import { ChartwerkPod, TickOrientation, TimeFormat } from '@chartwerk/core';
import { LineTimeSerie, LineOptions, Mode } from './types';
export declare class ChartwerkLineChart extends ChartwerkPod<LineTimeSerie, LineOptions> {
    lineGenerator: any;
    constructor(_el: HTMLElement, _series?: LineTimeSerie[], _options?: LineOptions);
    renderMetrics(): void;
    initLineGenerator(): void;
    appendData(data: [number, number][]): void;
    _renderDots(datapoints: number[][], serieIdx: number): void;
    _renderMetric(datapoints: number[][], metricOptions: {
        color: string;
        confidence: number;
        target: string;
        mode: Mode;
        serieIdx: number;
        renderDots: boolean;
    }): void;
    updateCrosshair(): void;
    appendCrosshairCircles(): void;
    appendCrosshairCircle(serieIdx: number): void;
    renderSharedCrosshair(timestamp: number): void;
    hideSharedCrosshair(): void;
    moveCrosshairLine(xPosition: number): void;
    moveCrosshairCircle(xPosition: number, yPosition: number, serieIdx: number): void;
    hideCrosshairCircle(serieIdx: number): void;
    getClosestDatapoint(serie: LineTimeSerie, xValue: number): [number, number];
    getClosestIndex(datapoints: [number, number][], xValue: number): number;
    get xValueInterval(): number | undefined;
    onMouseMove(): void;
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
        methods: {
            render(): void;
            renderChart(): void;
            appendEvents(): void;
            zoomIn(range: any): void;
            zoomOut(center: any): void;
            mouseMove(evt: any): void;
            mouseOut(): void;
            onLegendClick(idx: any): void;
            panningEnd(range: any): void;
            panning(range: any): void;
            contextMenu(evt: any): void;
        };
    }[];
    methods: {
        render(): void;
    };
};
export { LineTimeSerie, LineOptions, Mode, TickOrientation, TimeFormat };
