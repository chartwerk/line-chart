import { ChartwerkBase } from '@chartwerk/base';
import { LineTimeSerie, LineOptions, RenderMetricOption } from './types';
export declare class ChartwerkLineChart extends ChartwerkBase<LineTimeSerie, LineOptions> {
    constructor(el: HTMLElement, _series?: LineTimeSerie[], _options?: LineOptions);
    _renderMetrics(): void;
    _renderMetric(datapoints: number[][], options: RenderMetricOption): void;
    renderSharedCrosshair(timestamp: number): void;
    hideSharedCrosshair(): void;
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
        };
    }[];
    methods: {
        render(): void;
    };
};
